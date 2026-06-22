export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export function getDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 5432),
    username: process.env.DATABASE_USER ?? 'agent',
    password: process.env.DATABASE_PASSWORD ?? 'agent',
    database: process.env.DATABASE_NAME ?? 'agent_dev',
  };
}
