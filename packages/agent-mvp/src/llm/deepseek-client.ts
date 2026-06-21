import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface DeepSeekClientOptions {
  packageRoot: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatJsonRequest {
  messages: ChatMessage[];
  temperature?: number;
}

export interface ChatJsonResponse {
  content: string;
  model: string;
  usage?: unknown;
}

export class DeepSeekClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(options: DeepSeekClientOptions) {
    const env = loadLocalEnv(options.packageRoot);
    this.apiKey = readRequiredEnv(env, ['DEEPSEEK_API_KEY', 'LLM_API_KEY']);
    this.baseUrl =
      readOptionalEnv(env, ['DEEPSEEK_BASE_URL', 'LLM_BASE_URL']) ??
      'https://api.deepseek.com';
    this.model =
      readOptionalEnv(env, ['DEEPSEEK_MODEL', 'LLM_MODEL_ID']) ??
      'deepseek-chat';
  }

  async chatJson(request: ChatJsonRequest): Promise<ChatJsonResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek 请求失败：HTTP ${response.status} ${errorText}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
      usage?: unknown;
    };
    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('DeepSeek 响应中没有 message.content');
    }

    return {
      content,
      model: payload.model ?? this.model,
      usage: payload.usage,
    };
  }
}

function loadLocalEnv(packageRoot: string): Record<string, string> {
  const envPath = resolve(packageRoot, '.env');

  if (!existsSync(envPath)) {
    return {};
  }

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  const result: Record<string, string> = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    result[key] = rawValue.replace(/^["']|["']$/g, '');
  }

  return result;
}

function readRequiredEnv(env: Record<string, string>, keys: string[]): string {
  const value = readOptionalEnv(env, keys);

  if (!value) {
    throw new Error(
      `缺少环境变量 ${keys.join(' 或 ')}，请在 packages/agent-mvp/.env 中配置`,
    );
  }

  return value;
}

function readOptionalEnv(
  env: Record<string, string>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = env[key] ?? process.env[key];

    if (value) {
      return value;
    }
  }

  return undefined;
}
