import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import OpenAI from 'openai';

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

export interface TokenUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  prompt_tokens_details?: unknown;
  completion_tokens_details?: unknown;
  prompt_cache_hit_tokens?: number;
  prompt_cache_miss_tokens?: number;
}

export interface ChatJsonResponse {
  content: string;
  model: string;
  usage?: TokenUsage;
  attempts: number;
}

export class DeepSeekClient {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly maxRetries: number;

  constructor(options: DeepSeekClientOptions) {
    const env = loadLocalEnv(options.packageRoot);
    const apiKey = readRequiredEnv(env, ['DEEPSEEK_API_KEY', 'LLM_API_KEY']);
    const baseURL =
      readOptionalEnv(env, ['DEEPSEEK_BASE_URL', 'LLM_BASE_URL']) ??
      'https://api.deepseek.com';
    const timeout = readNumberEnv(
      env,
      ['DEEPSEEK_TIMEOUT_MS', 'LLM_TIMEOUT_MS'],
      120_000,
    );

    this.model =
      readOptionalEnv(env, ['DEEPSEEK_MODEL', 'LLM_MODEL_ID']) ??
      'deepseek-chat';
    this.maxRetries = readNumberEnv(
      env,
      ['DEEPSEEK_MAX_RETRIES', 'LLM_MAX_RETRIES'],
      2,
    );
    this.client = new OpenAI({
      apiKey,
      baseURL,
      timeout,
      maxRetries: 0,
    });
  }

  async chatJson(request: ChatJsonRequest): Promise<ChatJsonResponse> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt += 1) {
      try {
        return await this.sendChatJsonRequest(request, attempt);
      } catch (error) {
        lastError = error;

        if (!shouldRetry(error) || attempt > this.maxRetries) {
          break;
        }

        await sleep(800 * attempt);
      }
    }

    throw lastError instanceof Error ? lastError : new Error('DeepSeek 请求失败');
  }

  private async sendChatJsonRequest(
    request: ChatJsonRequest,
    attempt: number,
  ): Promise<ChatJsonResponse> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.2,
      response_format: { type: 'json_object' },
    });
    const content = completion.choices[0]?.message.content;

    if (!content) {
      throw new Error('DeepSeek 响应中没有 message.content');
    }

    return {
      content,
      model: completion.model ?? this.model,
      usage: completion.usage,
      attempts: attempt,
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

function readNumberEnv(
  env: Record<string, string>,
  keys: string[],
  fallback: number,
): number {
  const value = readOptionalEnv(env, keys);

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function shouldRetry(error: unknown): boolean {
  const status = getErrorStatus(error);

  if (status !== undefined) {
    return status === 429 || status >= 500;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }

  return error instanceof TypeError;
}

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return undefined;
  }

  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' ? status : undefined;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}
