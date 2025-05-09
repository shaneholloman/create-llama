import { ChromaVectorStore } from "@llamaindex/chroma";
import { VectorStoreIndex } from "llamaindex";
import { checkRequiredEnvVars } from "./shared";

export async function getDataSource(params?: any) {
  checkRequiredEnvVars();
  const chromaUri = `http://${process.env.CHROMA_HOST}:${process.env.CHROMA_PORT}`;

  const store = new ChromaVectorStore({
    collectionName: process.env.CHROMA_COLLECTION!,
    chromaClientParams: { path: chromaUri },
  });

  return await VectorStoreIndex.fromVectorStore(store);
}
