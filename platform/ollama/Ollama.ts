import { fetchEnvVar } from "@platform/utils";
import {
  OllamaClient,
  OllamaGenerateResponse,
  OllamaModelListResponse,
} from "./types/Ollama";

export default class Ollama implements OllamaClient {
  ollamaApi: string;
  model: string;

  constructor(model: string) {
    this.ollamaApi = fetchEnvVar("OLLAMA_API", "http://ollama:11434/api");
    this.model = model
      ? model
      : fetchEnvVar("DEFAULT_OLLAMA_MODEL", "gemma3:4b");
  }

  async create(model?: string): Promise<Ollama> {
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

  async listModels(): Promise<OllamaModelListResponse> {
    const res = await fetch(`${this.ollamaApi}/tags`);

    return (await res.json()) as OllamaModelListResponse;
  }

  async generate(prompt: string): Promise<OllamaGenerateResponse> {
    const res = await fetch(`${this.ollamaApi}/generate`, {
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
