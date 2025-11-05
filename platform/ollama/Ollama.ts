import { fetchEnvVar } from "@platform/utils";
import {
  OllamaClient,
  OllamaGenerateResponse,
  OllamaModelListResponse,
} from "./types/Ollama";

export default class Ollama implements OllamaClient {
  static ollamaApi: string = fetchEnvVar(
    "OLLAMA_API",
    "http://ollama:11434/api"
  );
  model: string;

  private constructor(model: string) {
    this.model = model
      ? model
      : fetchEnvVar("DEFAULT_OLLAMA_MODEL", "gemma3:4b");
  }

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

  private static async listModels(): Promise<OllamaModelListResponse> {
    const res = await fetch(`${this.ollamaApi}/tags`);

    return (await res.json()) as OllamaModelListResponse;
  }

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
