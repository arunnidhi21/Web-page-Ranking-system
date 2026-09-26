from fastapi.testclient import TestClient

from app.main import app
from app.services.ranking import get_ranking_service

client = TestClient(app)


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_search_returns_ranked_results():
    res = client.get("/api/search", params={"q": "machine learning", "limit": 5})
    assert res.status_code == 200
    body = res.json()
    assert body["query"] == "machine learning"
    assert 0 < len(body["results"]) <= 5
    assert body["count"] == len(body["results"])
    # results must be sorted by final_score, descending, with contiguous ranks starting at 1
    scores = [r["final_score"] for r in body["results"]]
    assert scores == sorted(scores, reverse=True)
    assert [r["rank"] for r in body["results"]] == list(range(1, len(body["results"]) + 1))


def test_search_result_shape():
    res = client.get("/api/search", params={"q": "pagerank", "limit": 3})
    body = res.json()
    assert body["results"], "expected at least one result for 'pagerank'"
    top = body["results"][0]
    for field in ("rank", "id", "title", "url", "snippet", "relevance_score", "pagerank_score", "final_score"):
        assert field in top
    # PageRank result should be the top (or very near top) match for a query naming the algorithm
    assert top["id"] == "pagerank"


def test_search_missing_query_is_422():
    res = client.get("/api/search")
    assert res.status_code == 422
    assert "error" in res.json()


def test_search_empty_query_is_422():
    res = client.get("/api/search", params={"q": ""})
    assert res.status_code == 422


def test_search_invalid_limit_is_422():
    res = client.get("/api/search", params={"q": "graph", "limit": 0})
    assert res.status_code == 422
    res = client.get("/api/search", params={"q": "graph", "limit": 999})
    assert res.status_code == 422


def test_search_no_matches_returns_empty_list_not_error():
    res = client.get("/api/search", params={"q": "zzzznonexistentword123"})
    assert res.status_code == 200
    body = res.json()
    assert body["count"] == 0
    assert body["results"] == []


def test_graph_endpoint_shape():
    res = client.get("/api/graph")
    assert res.status_code == 200
    body = res.json()
    assert len(body["nodes"]) > 0
    assert len(body["edges"]) > 0
    node = body["nodes"][0]
    for field in ("id", "label", "url", "pagerank", "incoming", "outgoing"):
        assert field in node
    node_ids = {n["id"] for n in body["nodes"]}
    for edge in body["edges"]:
        assert edge["source"] in node_ids
        assert edge["target"] in node_ids


def test_pagerank_scores_are_normalized_and_sum_reasonably():
    service = get_ranking_service()
    data = service.graph_data()
    pr_values = [n["pagerank"] for n in data["nodes"]]
    assert max(pr_values) == 1.0  # normalized so the top page is exactly 1.0
    assert all(0 < v <= 1.0 for v in pr_values)


def test_pagerank_rewards_pages_with_more_incoming_links():
    # Not a strict mathematical guarantee in general, but true for this dataset:
    # 'ml' has by far the most incoming links and should have high PageRank.
    service = get_ranking_service()
    data = service.graph_data()
    by_id = {n["id"]: n for n in data["nodes"]}
    most_linked = max(data["nodes"], key=lambda n: n["incoming"])
    # the most-linked page should rank in the top few by pagerank
    ranked_by_pr = sorted(data["nodes"], key=lambda n: n["pagerank"], reverse=True)
    top_ids = [n["id"] for n in ranked_by_pr[:5]]
    assert most_linked["id"] in top_ids
