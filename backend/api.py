from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from B_learning_buddy_core import handle_user_message

app = FastAPI(title="Learning Buddy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5175",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Vite
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    user_id: str
    message: str

@app.post("/chat")
def chat(req: ChatRequest):
    reply = handle_user_message(req.user_id, req.message)
    return {
        "reply": reply
    }

@app.get("/")
def health():
    return {"status": "ok"}

from fastapi.middleware.cors import CORSMiddleware
