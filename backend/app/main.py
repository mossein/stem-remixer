import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import ALLOWED_ORIGINS
from .routers import sessions, stems, upload

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Stem Remixer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(stems.router)
app.include_router(sessions.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
