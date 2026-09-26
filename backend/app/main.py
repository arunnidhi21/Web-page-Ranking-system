from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Web Search Ranking System API",
    description="TF-IDF relevance + PageRank search ranking over a sample document graph.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {"service": "web-search-ranking-system-api", "status": "ok", "docs": "/docs"}


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    # Turns FastAPI's default 422 body into the same {"error": ..., "detail": ...}
    # shape the rest of the API uses, so the frontend only has one error format to handle.
    messages = [f"{'.'.join(str(p) for p in e['loc'])}: {e['msg']}" for e in exc.errors()]
    return JSONResponse(status_code=422, content={"error": "Invalid request", "detail": "; ".join(messages)})
