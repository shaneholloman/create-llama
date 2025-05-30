import { PGVectorStore } from "@llamaindex/postgres";
import * as dotenv from "dotenv";
import { VectorStoreIndex, storageContextFromDefaults } from "llamaindex";
import { getDocuments } from "./loader";
import { initSettings } from "./settings";
import {
  PGVECTOR_COLLECTION,
  PGVECTOR_SCHEMA,
  PGVECTOR_TABLE,
  checkRequiredEnvVars,
} from "./shared";

dotenv.config();

async function loadAndIndex() {
  // load objects from storage and convert them into LlamaIndex Document objects
  const documents = await getDocuments();

  // create postgres vector store
  const vectorStore = new PGVectorStore({
    clientConfig: {
      connectionString: process.env.PG_CONNECTION_STRING,
    },
    schemaName: PGVECTOR_SCHEMA,
    tableName: PGVECTOR_TABLE,
  });
  vectorStore.setCollection(PGVECTOR_COLLECTION);
  vectorStore.clearCollection();

  // create index from all the Documents
  console.log("Start creating embeddings...");
  const storageContext = await storageContextFromDefaults({ vectorStore });
  await VectorStoreIndex.fromDocuments(documents, { storageContext });
  console.log(`Successfully created embeddings.`);
}

(async () => {
  try {
    checkRequiredEnvVars();
    initSettings();
    await loadAndIndex();
    console.log("Finished generating storage.");
  } catch (error) {
    console.error("Error generating storage.", error);
  }
})();
