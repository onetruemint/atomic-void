import {
  OllamaClient,
  OllamaGenerateResponse,
  OllamaModelListResponse,
} from "./Ollama";
import { fetchEnvVar } from "@platform/utils";

export default class Ollama implements OllamaClient {
  ollamaApi: string;
  model: string;

  constructor() {
    this.ollamaApi = fetchEnvVar("OLLAMA_API", "http://ollama:11434/api");
    this.model = fetchEnvVar("DEFAULT_OLLAMA_MODEL", "gemma3:4b");
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

async function main() {
  const prompt = "why is the sky blue?";

  const ollamaInstance = new Ollama();
  console.log(JSON.stringify(await ollamaInstance.generate(prompt), null, 2));
}

main();
