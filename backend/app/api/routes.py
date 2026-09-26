from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import GraphResponse, SearchResponse
from app.services.ranking import get_ranking_service

router = APIRouter(prefix="/api", tags=["search"])


@router.get("/search", response_model=SearchResponse)
def search(
    q: str = Query(..., min_length=1, description="Search query text"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results to return"),
):
    """Ranks the sample document collection against `q` using TF-IDF relevance
    combined with PageRank, and returns the top `limit` results."""
    if not q.strip():
        raise HTTPException(status_code=400, detail="Query parameter 'q' must not be empty.")

    service = get_ranking_service()
    try:
        results = service.search(q, limit)
    except Exception as exc:  # pragma: no cover - defensive: surfaces as a clean 500 instead of a stack trace
        raise HTTPException(status_code=500, detail=f"Search failed: {exc}") from exc

    return SearchResponse(query=q, count=len(results), results=results)


@router.get("/graph", response_model=GraphResponse)
def graph():
    """Returns every document as a node (sized by PageRank) and every hyperlink
    as an edge, for the 3D graph visualization."""
    service = get_ranking_service()
    try:
        data = service.graph_data()
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"Could not build graph: {exc}") from exc
    return GraphResponse(**data)
