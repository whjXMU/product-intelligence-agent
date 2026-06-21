import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const packageRoot = resolve(import.meta.dirname, '..');
const requiredPaths = [
  'input/task.json',
  'input/self.html',
  'input/competitor.html',
];

console.log('Agent MVP 已接入 workspace。');
console.log('当前阶段只完成实验包骨架，尚未执行 HTML 提取和 LLM 分析。');

for (const relativePath of requiredPaths) {
  const absolutePath = resolve(packageRoot, relativePath);
  const status = existsSync(absolutePath) ? '已准备' : '待补充';
  console.log(`${status}: ${relativePath}`);
}
