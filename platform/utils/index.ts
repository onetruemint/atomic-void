import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

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
