import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { extractHomepageProfile } from '../extractors/html-to-homepage.js';
import { readAgentMvpInputs } from '../io/read-inputs.js';
import { DeepSeekClient } from '../llm/deepseek-client.js';
import { buildCompetitiveAnalysisPrompt } from '../prompts/competitive-analysis.prompt.js';
import { renderMarkdownReport } from '../renderers/markdown-report.js';
import {
  agentMvpTraceSchema,
  competitiveAnalysisReportSchema,
  homepagePairSchema,
} from '../schemas/index.js';
import { TraceRecorder } from '../trace/trace-recorder.js';

export async function runCompetitiveAnalysisWorkflow(
  packageRoot: string,
): Promise<void> {
  const trace = new TraceRecorder(
    `trace-${Date.now()}`,
    'competitive-homepage-analysis',
  );
  const outputDir = resolve(packageRoot, 'output');
  mkdirSync(outputDir, { recursive: true });

  try {
    const inputs = await trace.runStep(
      'read-inputs',
      '读取任务和 HTML 输入',
      'task.json, self.html, competitor.html',
      () => readAgentMvpInputs(packageRoot),
      (result) =>
        `${result.task.selfProduct.name} vs ${result.task.competitorProduct.name}`,
    );

    const homepagePair = await trace.runStep(
      'extract-homepage-profiles',
      '提取首页结构化信息',
      '两个 HTML 文件',
      () =>
        homepagePairSchema.parse({
          self: extractHomepageProfile({
            productName: inputs.task.selfProduct.name,
            sourceFile: inputs.task.selfProduct.htmlFile,
            html: inputs.selfHtml,
          }),
          competitor: extractHomepageProfile({
            productName: inputs.task.competitorProduct.name,
            sourceFile: inputs.task.competitorProduct.htmlFile,
            html: inputs.competitorHtml,
          }),
        }),
      (result) =>
        `self headings=${result.self.headings.length}, competitor headings=${result.competitor.headings.length}`,
    );

    writeJson(resolve(outputDir, 'homepage-profiles.json'), homepagePair);

    const prompt = buildCompetitiveAnalysisPrompt(inputs.task, homepagePair);
    const llmResponse = await trace.runStep(
      'deepseek-analysis',
      '调用 DeepSeek 生成竞品分析',
      `prompt chars=${prompt.length}`,
      () =>
        new DeepSeekClient({ packageRoot }).chatJson({
          messages: [
            {
              role: 'system',
              content:
                '你只输出严格 JSON。你的分析必须以输入证据为依据，不能编造网页没有提供的信息。',
            },
            { role: 'user', content: prompt },
          ],
        }),
      (result) => `model=${result.model}`,
    );

    const report = await trace.runStep(
      'parse-report',
      '校验模型 JSON 输出',
      'DeepSeek message.content',
      () =>
        competitiveAnalysisReportSchema.parse(
          JSON.parse(extractJsonObject(llmResponse.content)),
        ),
      (result) =>
        `dimensions=${result.dimensions.length}, requirements=${result.requirements.length}`,
    );

    writeJson(resolve(outputDir, 'report.json'), report);
    writeFileSync(resolve(outputDir, 'report.md'), renderMarkdownReport(report));
  } finally {
    writeJson(resolve(outputDir, 'trace.json'), agentMvpTraceSchema.parse(trace.toJSON()));
  }
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function extractJsonObject(content: string): string {
  const trimmed = content.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('模型输出中未找到 JSON 对象');
  }

  return trimmed.slice(start, end + 1);
}
