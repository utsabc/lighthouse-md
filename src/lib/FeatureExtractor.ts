import {
  pipeline,
  env,
  FeatureExtractionPipeline,
} from "@xenova/transformers";

// Configure environment settings
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;

// Type definitions for the feature extractor
type ProgressCallback =
  | ((progress: { status: string; progress: number }) => void)
  | null;

interface ExtractionOptions {
  pooling: "mean" | "max" | "cls" | "none";
  normalize: boolean;
}

// Type for the pipeline result (a Float32Array in this case)
type ExtractorOutput = Float32Array;

class FeatureExtractorSingleton {
  private static readonly model: string = "Xenova/all-MiniLM-L6-v2";
  private static instance: Promise<FeatureExtractionPipeline> | null = null;

  private constructor() {
    // Private constructor to prevent instantiation
  }

  public static async getInstance(): Promise<FeatureExtractionPipeline> {
    if (this.instance === null) {
      this.instance = pipeline("feature-extraction", this.model);
    }
    return this.instance;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function extractFeatures(text: string | string[]): Promise<any[]> {
  const extractor = await FeatureExtractorSingleton.getInstance();
  const messageEmbeddingResult = await extractor(text, {
    pooling: "mean",
    normalize: false,
  });

  const messageEmbedding = Array.from(
    { length: messageEmbeddingResult.size },
    (_, i) => messageEmbeddingResult.data[`${i}`]
  );
  return messageEmbedding;
}

export {
  extractFeatures,
  type ProgressCallback,
  type ExtractionOptions,
  type ExtractorOutput,
};
