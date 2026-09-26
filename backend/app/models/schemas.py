"""Pydantic models for request/response shapes. Keeping these separate from the
route handlers makes the API contract easy to read and reuse in tests."""
from pydantic import BaseModel, Field


class SearchResult(BaseModel):
    rank: int
    id: str
    title: str
    url: str
    snippet: str
    relevance_score: float
    pagerank_score: float
    final_score: float


class SearchResponse(BaseModel):
    query: str
    count: int
    results: list[SearchResult]


class GraphNode(BaseModel):
    id: str
    label: str
    url: str
    pagerank: float
    incoming: int
    outgoing: int


class GraphEdge(BaseModel):
    source: str
    target: str


class GraphResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
