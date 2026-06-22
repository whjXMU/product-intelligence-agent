export interface AppConfig {
  port: number;
  webOrigin: string;
}

export function getAppConfig(): AppConfig {
  return {
    port: Number(process.env.API_PORT ?? 3000),
    webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  };
}
