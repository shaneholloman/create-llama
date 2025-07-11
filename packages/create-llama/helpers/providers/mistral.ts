import prompts from "prompts";
import { ModelConfigParams } from ".";
import { questionHandlers, toChoice } from "../../questions/utils";

const MODELS = ["mistral-tiny", "mistral-small", "mistral-medium"];
type ModelData = {
  dimensions: number;
};
const EMBEDDING_MODELS: Record<string, ModelData> = {
  "mistral-embed": { dimensions: 1024 },
};

const DEFAULT_MODEL = MODELS[0];
const DEFAULT_EMBEDDING_MODEL = Object.keys(EMBEDDING_MODELS)[0];
const DEFAULT_DIMENSIONS = Object.values(EMBEDDING_MODELS)[0].dimensions;

export async function askMistralQuestions(): Promise<ModelConfigParams> {
  const config: ModelConfigParams = {
    apiKey: process.env.MISTRAL_API_KEY,
    model: DEFAULT_MODEL,
    embeddingModel: DEFAULT_EMBEDDING_MODEL,
    dimensions: DEFAULT_DIMENSIONS,
    isConfigured(): boolean {
      if (config.apiKey) {
        return true;
      }
      if (process.env["MISTRAL_API_KEY"]) {
        return true;
      }
      return false;
    },
  };

  if (!config.apiKey) {
    const { key } = await prompts(
      {
        type: "text",
        name: "key",
        message:
          "Please provide your Mistral API key (or leave blank to use MISTRAL_API_KEY env variable):",
      },
      questionHandlers,
    );
    config.apiKey = key || process.env.MISTRAL_API_KEY;
  }

  const { model } = await prompts(
    {
      type: "select",
      name: "model",
      message: "Which LLM model would you like to use?",
      choices: MODELS.map(toChoice),
      initial: 0,
    },
    questionHandlers,
  );
  config.model = model;

  const { embeddingModel } = await prompts(
    {
      type: "select",
      name: "embeddingModel",
      message: "Which embedding model would you like to use?",
      choices: Object.keys(EMBEDDING_MODELS).map(toChoice),
      initial: 0,
    },
    questionHandlers,
  );
  config.embeddingModel = embeddingModel;
  config.dimensions = EMBEDDING_MODELS[embeddingModel].dimensions;

  return config;
}
