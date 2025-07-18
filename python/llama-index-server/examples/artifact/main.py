from code_workflow import ArtifactWorkflow
from fastapi import FastAPI

# To use document artifact workflow, uncomment the following line
# from document_workflow import ArtifactWorkflow
from llama_index.core.workflow import Workflow
from llama_index.llms.openai import OpenAI
from llama_index.server import LlamaIndexServer, UIConfig
from llama_index.server.models import ChatRequest


def create_workflow(chat_request: ChatRequest) -> Workflow:
    workflow = ArtifactWorkflow(
        llm=OpenAI(model="gpt-4.1"),
        chat_request=chat_request,
        timeout=120.0,
    )
    return workflow


def create_app() -> FastAPI:
    app = LlamaIndexServer(
        workflow_factory=create_workflow,
        ui_config=UIConfig(
            starter_questions=[
                "Write a simple calculator app",
                "Write a guideline on how to use LLM effectively",
            ],
            component_dir="components",
            layout_dir="layout",
        ),
    )
    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
