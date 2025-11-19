import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = getDirname(import.meta.url);
dotenv.config({ path: `${__dirname}/../../.env` });

/**
 * Fetches a Node environment variable
 * @param variable The variable to look for
 * @param defaultValue A default value if the variable is not set
 * @returns The variable if it exists
 */
export function fetchEnvVar<T extends string, D extends T = T>(
  variable: string,
  defaultValue: D | null = null
): T {
  if (!process.env[variable]) {
    if (defaultValue) {
      return defaultValue;
    }
    throw new Error(`Environment Variable not set: ${variable}`);
  }
  return process.env[variable] as T;
}

export function getDirname(urlPath: string): string {
  const filename = fileURLToPath(urlPath);
  return path.dirname(filename);
}
