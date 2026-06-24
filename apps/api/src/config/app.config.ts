export interface AppConfig {
  port: number;
  webOrigins: string[];
}

export function getAppConfig(): AppConfig {
  return {
    port: Number(process.env.API_PORT ?? 3000),
    webOrigins: parseWebOrigins(
      process.env.WEB_ORIGINS ?? process.env.WEB_ORIGIN,
    ),
  };
}

function parseWebOrigins(value?: string): string[] {
  if (!value) {
    return ['http://localhost:5173', 'http://127.0.0.1:5173'];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}
