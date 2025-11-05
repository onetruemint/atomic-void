import { fetchEnvVar } from "@platform/utils";
import {
  OllamaClient,
  OllamaGenerateResponse,
  OllamaModelListResponse,
} from "./types/Ollama";

/**
 * Client for interacting with the Ollama API.
 * Provides methods to generate text using Ollama models.
 *
 * @example
 * ```typescript
 * const ollama = await Ollama.create("llama2");
 * const response = await ollama.generate("What is the capital of France?");
 * console.log(response.response);
 * ```
 */
export default class Ollama implements OllamaClient {
  /**
   * The base URL for the Ollama API.
   * Fetched from the OLLAMA_API environment variable, defaults to "http://ollama:11434/api".
   */
  static ollamaApi: string = fetchEnvVar(
    "OLLAMA_API",
    "http://ollama:11434/api"
  );

  /**
   * The name of the Ollama model to use for text generation.
   */
  model: string;

  /**
   * Private constructor to enforce use of the static `create` method.
   *
   * @param model - The name of the Ollama model to use. If not provided,
   *                uses the DEFAULT_OLLAMA_MODEL environment variable or "gemma3:4b" as fallback.
   */
  private constructor(model: string) {
    this.model = model
      ? model
      : fetchEnvVar("DEFAULT_OLLAMA_MODEL", "gemma3:4b");
  }

  /**
   * Creates a new Ollama instance with the specified model.
   * Validates that the model exists in the available models list.
   * If validation fails or no model is provided, uses the default model.
   *
   * @param model - Optional name of the Ollama model to use. If not provided or invalid,
   *                the default model from environment variable or "gemma3:4b" will be used.
   * @returns A promise that resolves to an Ollama instance.
   *
   * @example
   * ```typescript
   * // Create with a specific model
   * const ollama = await Ollama.create("llama2");
   *
   * // Create with default model
   * const ollama = await Ollama.create();
   * ```
   */
  static async create(model?: string): Promise<Ollama> {
    if (
      !model ||
      !(await this.listModels()).models.filter(
        (availableModel) => availableModel.name === model
      )
    ) {
      return new Ollama(fetchEnvVar("DEFAULT_OLLAMA_MODEL", "gemma3:4b"));
    }
    return new Ollama(model);
  }

  /**
   * Fetches the list of available Ollama models from the API.
   *
   * @returns A promise that resolves to the list of available models.
   * @private
   */
  private static async listModels(): Promise<OllamaModelListResponse> {
    const res = await fetch(`${this.ollamaApi}/tags`);

    return (await res.json()) as OllamaModelListResponse;
  }

  /**
   * Generates text using the configured Ollama model.
   *
   * @param prompt - The text prompt to send to the model for generation.
   * @returns A promise that resolves to the generation response, including
   *          the generated text, model information, and timing metrics.
   *
   * @example
   * ```typescript
   * const ollama = await Ollama.create();
   * const response = await ollama.generate("Explain quantum computing in simple terms.");
   * console.log(response.response); // The generated text
   * console.log(response.total_duration); // Total generation time in nanoseconds
   * ```
   */
  async generate(prompt: string): Promise<OllamaGenerateResponse> {
    const res = await fetch(`${Ollama.ollamaApi}/generate`, {
      method: "POST",
      body: JSON.stringify({
        stream: false,
        model: this.model,
        prompt,
      }),
    });

    return (await res.json()) as OllamaGenerateResponse;
  }
}
