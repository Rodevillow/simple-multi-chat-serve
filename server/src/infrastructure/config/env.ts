import { existsSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const envCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../.env")
];

for (const candidate of envCandidates) {
  if (existsSync(candidate)) {
    dotenv.config({ path: candidate, override: false });
  }
}

export const config = {
  port: Number(process.env.SERVER_PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/test?schema=public",
  jwtSecret: process.env.JWT_SECRET ?? "dev_secret_change_me",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000,http://localhost:3001",
  bodyLimit: process.env.BODY_LIMIT ?? "10mb",
  nodeEnv: process.env.NODE_ENV ?? "development"
};

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = config.databaseUrl;
}
