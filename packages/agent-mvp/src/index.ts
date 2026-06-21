import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { runCompetitiveAnalysisWorkflow } from './workflows/competitive-analysis.js';

const packageRoot = resolve(import.meta.dirname, '..');
const requiredPaths = [
  'input/task.json',
  'input/self.html',
  'input/competitor.html',
];

console.log('Agent MVP 已接入 workspace。');
console.log('当前阶段会执行：HTML 提取 -> DeepSeek 分析 -> JSON/Markdown/Trace 输出。');

for (const relativePath of requiredPaths) {
  const absolutePath = resolve(packageRoot, relativePath);
  const status = existsSync(absolutePath) ? '已准备' : '待补充';
  console.log(`${status}: ${relativePath}`);
}

if (requiredPaths.every((relativePath) => existsSync(resolve(packageRoot, relativePath)))) {
  await runCompetitiveAnalysisWorkflow(packageRoot);
  console.log('Agent MVP 分析完成。');
  console.log(`已输出: ${resolve(packageRoot, 'output/homepage-profiles.json')}`);
  console.log(`已输出: ${resolve(packageRoot, 'output/report.json')}`);
  console.log(`已输出: ${resolve(packageRoot, 'output/report.md')}`);
  console.log(`已输出: ${resolve(packageRoot, 'output/quality-check.json')}`);
  console.log(`已输出: ${resolve(packageRoot, 'output/llm-response-meta.json')}`);
  console.log(`已输出: ${resolve(packageRoot, 'output/prompt-meta.json')}`);
  console.log(`已输出: ${resolve(packageRoot, 'output/trace.json')}`);
} else {
  console.log('下一步：复制 input/task.example.json 为 input/task.json，并放入两个 HTML 文件。');
}
