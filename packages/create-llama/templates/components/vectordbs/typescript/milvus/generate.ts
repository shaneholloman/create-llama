import { MilvusVectorStore } from "@llamaindex/milvus";
import * as dotenv from "dotenv";
import { VectorStoreIndex, storageContextFromDefaults } from "llamaindex";
import { getDocuments } from "./loader";
import { initSettings } from "./settings";
import { checkRequiredEnvVars, getMilvusClient } from "./shared";

dotenv.config();

const collectionName = process.env.MILVUS_COLLECTION;

async function loadAndIndex() {
  // load objects from storage and convert them into LlamaIndex Document objects
  const documents = await getDocuments();

  // Connect to Milvus
  const milvusClient = getMilvusClient();
  const vectorStore = new MilvusVectorStore({ milvusClient });

  // now create an index from all the Documents and store them in Milvus
  const storageContext = await storageContextFromDefaults({ vectorStore });
  await VectorStoreIndex.fromDocuments(documents, {
    storageContext: storageContext,
  });
  console.log(
    `Successfully created embeddings in the Milvus collection ${collectionName}.`,
  );
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
