# Web Search Ranking System — Backend

FastAPI backend that ranks a sample collection of documents by combining
**TF-IDF text relevance** with **PageRank authority**, and serves the link
graph for the frontend's 3D visualization.

## Install

```bash
cd backend
python3 -m venv venv && source venv/bin/activate   # optional but recommended
pip install -r requirements.txt
cp .env.example .env
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

The API is now at `http://localhost:8000`, with interactive docs at
`http://localhost:8000/docs`.

## Run tests

```bash
pytest -q
```

## Ranking formula

```
final_score = RELEVANCE_WEIGHT * relevance_score + PAGERANK_WEIGHT * pagerank_score
```

- **relevance_score** — cosine similarity between the query and the document,
  both represented as TF-IDF vectors over the document's title, description
  and content (`app/services/ranking.py`, using scikit-learn).
- **pagerank_score** — the document's PageRank in the hyperlink graph built
  from every document's `links`, computed with NetworkX and normalized so the
  highest-scoring page is `1.0`.
- Weights (default `0.7` / `0.3`) and the PageRank damping factor (default
  `0.85`) are configured via environment variables in `.env`, not hardcoded.

## API endpoints

### `GET /api/search?q=<query>&limit=<n>`

- `q` (required, non-empty string) — the search query.
- `limit` (optional, default `10`, `1`–`50`) — max results to return.

```json
{
  "query": "machine learning",
  "count": 5,
  "results": [
    {
      "rank": 1,
      "id": "ml",
      "title": "Machine Learning Fundamentals",
      "url": "https://example.edu/wiki/machine-learning",
      "snippet": "An introduction to how machines learn patterns from data...",
      "relevance_score": 0.3765,
      "pagerank_score": 0.7639,
      "final_score": 0.4928
    }
  ]
}
```

An empty or missing `q`, or a `limit` outside `1`–`50`, returns `422` with
`{"error": "...", "detail": "..."}`. A query with no matching documents
returns `200` with `"results": []`, not an error.

### `GET /api/graph`

```json
{
  "nodes": [
    { "id": "ml", "label": "Machine Learning Fundamentals", "url": "...", "pagerank": 0.76, "incoming": 11, "outgoing": 8 }
  ],
  "edges": [ { "source": "ml", "target": "nn" } ]
}
```

### `GET /api/health`

`{"status": "ok"}` — for uptime checks.

## Project structure

```
backend/
├── app/
│   ├── main.py            # FastAPI app, CORS, error handlers
│   ├── config.py          # settings loaded from .env
│   ├── api/routes.py      # /api/search, /api/graph
│   ├── services/ranking.py# TF-IDF + PageRank + combined scoring
│   ├── models/schemas.py  # Pydantic request/response models
│   └── data/
│       ├── dataset.json       # 28 sample documents + links (checked in)
│       └── build_dataset.py   # regenerates dataset.json if you edit it
├── tests/test_api.py
├── requirements.txt
└── .env.example
```

## Dataset

28 short, hand-written articles on machine learning, search/graph theory and
supporting CS/math topics (`app/data/dataset.json`), cross-linked with ~100
hyperlinks so PageRank has a real, non-trivial graph to work with. No
external sites are scraped or contacted — everything runs offline.

## Configuration (`.env`)

| Variable | Default | Meaning |
|---|---|---|
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | comma-separated origins allowed to call the API |
| `RELEVANCE_WEIGHT` | `0.7` | weight on TF-IDF relevance in the final score |
| `PAGERANK_WEIGHT` | `0.3` | weight on normalized PageRank in the final score |
| `PAGERANK_DAMPING` | `0.85` | PageRank damping factor (`d`) |
