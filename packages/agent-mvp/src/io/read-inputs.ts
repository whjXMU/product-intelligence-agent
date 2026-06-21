import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  parseCompetitiveAnalysisTask,
  type CompetitiveAnalysisTask,
} from '../schemas/index.js';

export interface AgentMvpInputs {
  task: CompetitiveAnalysisTask;
  selfHtml: string;
  competitorHtml: string;
}

export function readAgentMvpInputs(packageRoot: string): AgentMvpInputs {
  const taskPath = resolve(packageRoot, 'input/task.json');

  assertFileExists(taskPath, '缺少 input/task.json，请先复制 task.example.json');

  const task = parseCompetitiveAnalysisTask(readJson(taskPath));
  const selfHtmlPath = resolve(packageRoot, 'input', task.selfProduct.htmlFile);
  const competitorHtmlPath = resolve(
    packageRoot,
    'input',
    task.competitorProduct.htmlFile,
  );

  assertFileExists(selfHtmlPath, `缺少己方 HTML 文件：${task.selfProduct.htmlFile}`);
  assertFileExists(
    competitorHtmlPath,
    `缺少竞品 HTML 文件：${task.competitorProduct.htmlFile}`,
  );

  return {
    task,
    selfHtml: readFileSync(selfHtmlPath, 'utf8'),
    competitorHtml: readFileSync(competitorHtmlPath, 'utf8'),
  };
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function assertFileExists(path: string, message: string): void {
  if (!existsSync(path)) {
    throw new Error(message);
  }
}
