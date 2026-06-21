import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { evaluateReportQuality } from '../evaluators/report-quality.js';
import { extractHomepageProfile } from '../extractors/html-to-homepage.js';
import { readAgentMvpInputs } from '../io/read-inputs.js';
import { DeepSeekClient } from '../llm/deepseek-client.js';
import {
  buildCompetitiveAnalysisPrompt,
  buildReportJsonRepairPrompt,
  COMPETITIVE_ANALYSIS_PROMPT_VERSION,
} from '../prompts/competitive-analysis.prompt.js';
import { renderMarkdownReport } from '../renderers/markdown-report.js';
import {
  agentMvpTraceSchema,
  competitiveAnalysisReportSchema,
  homepagePairSchema,
  type CompetitiveAnalysisReport,
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
    const modelClient = new DeepSeekClient({ packageRoot });
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
    writeJson(resolve(outputDir, 'prompt-meta.json'), {
      promptVersion: COMPETITIVE_ANALYSIS_PROMPT_VERSION,
      promptChars: prompt.length,
    });

    const llmResponse = await trace.runStep(
      'deepseek-analysis',
      '调用 DeepSeek 生成竞品分析',
      `prompt chars=${prompt.length}`,
      () =>
        modelClient.chatJson({
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

    const parseResult = await trace.runStep(
      'parse-or-repair-report',
      '校验模型 JSON 输出，必要时修复',
      'DeepSeek message.content',
      () => parseOrRepairReport(modelClient, llmResponse.content),
      (result) =>
        `repaired=${result.repaired}, dimensions=${result.report.dimensions.length}, requirements=${result.report.requirements.length}`,
    );
    const report = parseResult.report;

    writeJson(resolve(outputDir, 'llm-response-meta.json'), {
      model: llmResponse.model,
      usage: llmResponse.usage,
      attempts: llmResponse.attempts,
      jsonRepair: {
        repaired: parseResult.repaired,
        repairAttempts: parseResult.repairAttempts,
        repairModel: parseResult.repairModel,
        repairUsage: parseResult.repairUsage,
      },
    });

    const qualityCheck = await trace.runStep(
      'quality-check',
      '执行本地报告质量检查',
      'report.json',
      () => evaluateReportQuality(report),
      (result) =>
        `passed=${result.passed}, issues=${result.issues.length}, metrics=${result.metrics.length}`,
    );

    writeJson(resolve(outputDir, 'report.json'), report);
    writeFileSync(resolve(outputDir, 'report.md'), renderMarkdownReport(report));
    writeJson(resolve(outputDir, 'quality-check.json'), qualityCheck);
  } finally {
    writeJson(
      resolve(outputDir, 'trace.json'),
      agentMvpTraceSchema.parse(trace.toJSON()),
    );
  }
}

interface ParseOrRepairResult {
  report: CompetitiveAnalysisReport;
  repaired: boolean;
  repairAttempts: number;
  repairModel?: string;
  repairUsage?: unknown;
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

async function parseOrRepairReport(
  modelClient: DeepSeekClient,
  content: string,
): Promise<ParseOrRepairResult> {
  try {
    return {
      report: parseReportContent(content),
      repaired: false,
      repairAttempts: 0,
    };
  } catch (error) {
    const repairResponse = await modelClient.chatJson({
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            '你只输出严格 JSON。你是 JSON 修复器，不负责重新分析或新增事实。',
        },
        {
          role: 'user',
          content: buildReportJsonRepairPrompt({
            originalContent: content,
            errorMessage:
              error instanceof Error ? error.message : '未知 JSON 校验错误',
          }),
        },
      ],
    });

    return {
      report: parseReportContent(repairResponse.content),
      repaired: true,
      repairAttempts: repairResponse.attempts,
      repairModel: repairResponse.model,
      repairUsage: repairResponse.usage,
    };
  }
}

function parseReportContent(content: string): CompetitiveAnalysisReport {
  return competitiveAnalysisReportSchema.parse(
    JSON.parse(extractJsonObject(content)),
  );
}
