# Web Search Ranking System

A graph-based search engine demo: a **React + Vite + Three.js** frontend with
an interactive 3D hyperlink graph, backed by a real **FastAPI** ranking
service that combines **TF-IDF relevance** with **PageRank** authority.

## 1. Overview

Type a query, and the backend scores every sample document by how well its
text matches the query (TF-IDF + cosine similarity) and how authoritative it
is in the hyperlink graph (PageRank), then combines the two into one ranked
list. The frontend visualizes that same graph in 3D — node size is PageRank,
and hovering or searching highlights the relevant pages and links live.

## 2. Features

- Real TF-IDF text relevance (scikit-learn) over a 28-document sample corpus
- Real PageRank (NetworkX) over the documents' actual hyperlinks
- Configurable ranking weights and damping factor via environment variables
- Interactive 3D hyperlink graph (Three.js) — rotate, zoom, select a node
- Live search with staged progress (query → graph → PageRank → ranking)
- A worked PageRank example you can step through by hand, iteration by
  iteration
- A convergence chart showing how PageRank settles over iterations
- Mock-data mode so the frontend runs standalone with no backend at all

## 3. Architecture

```
┌────────────────────┐        GET /api/search?q=...        ┌─────────────────────┐
│   React frontend    │ ───────────────────────────────────▶│   FastAPI backend    │
│  (Vite, Three.js)   │        GET /api/graph                │ (TF-IDF + PageRank)  │
│  src/services/api.js│◀───────────────────────────────────  │  app/services/       │
└────────────────────┘          JSON responses               │   ranking.py         │
                                                               └─────────────────────┘
```

`frontend/src/services/api.js` is the *only* file that talks to the backend.
It maps the backend's response fields onto the shape the rest of the frontend
already used with mock data, so no UI component had to change.

## 4. How PageRank works

Every document links to a handful of others (`backend/app/data/dataset.json`).
PageRank treats each link as a vote of importance, weighted by how important
the linking page itself is:

```
PR(A) = (1 − d) / N + d · Σ PR(i) / L(i)
```

`PR(i)` is the score of a page linking to `A`, `L(i)` is how many outgoing
links page `i` has (so it splits its vote evenly), `N` is the total number of
pages, and `d` (default `0.85`) is the damping factor — the chance a reader
follows a link instead of jumping to a random page. The backend computes this
with `networkx.pagerank`; the frontend's "How PageRank Works" section lets
you run the same formula by hand on a 3-page example.

## 5. How search ranking works

1. The query and every document (title + description + content) are turned
   into TF-IDF vectors.
2. Cosine similarity between the query vector and each document vector gives
   a **relevance score**.
3. Each document's precomputed, normalized **PageRank** is its authority
   score.
4. The two are combined (see below) and results are sorted by the combined
   score.

## 6. Ranking formula

```
final_score = RELEVANCE_WEIGHT * relevance_score + PAGERANK_WEIGHT * pagerank_score
```

Defaults: `RELEVANCE_WEIGHT=0.7`, `PAGERANK_WEIGHT=0.3`. Both are environment
variables in `backend/.env`, not hardcoded — see `backend/README.md`.

## 7. Backend API documentation

See `backend/README.md` for full request/response examples. Summary:

| Endpoint | Purpose |
|---|---|
| `GET /api/search?q=&limit=` | Ranked search results |
| `GET /api/graph` | Full node/edge graph with PageRank, for the 3D view |
| `GET /api/health` | Health check |

Interactive docs (Swagger UI) are served at `http://localhost:8000/docs` while
the backend is running.

## 8. Project structure

```
web-search-ranking-system/
├── frontend/
│   ├── src/
│   │   ├── components/   # Hero, SearchResults, GraphExplorer, ...
│   │   ├── three/         # Three.js scenes (NetworkScene, OrbScene)
│   │   ├── data/          # mock dataset + mock PageRank/search
│   │   ├── services/api.js
│   │   └── styles/
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py, config.py
│   │   ├── api/, services/, models/, data/
│   ├── tests/
│   ├── .env.example
│   └── requirements.txt
└── README.md   (this file)
```

## 9. Installation

```bash
git clone <this-repo>
cd web-search-ranking-system
```

## 10. Run the frontend

```bash
cd frontend
npm install
cp .env.example .env      # set VITE_USE_MOCK=false to use the real backend
npm run dev
```

Opens at `http://localhost:5173`. With `VITE_USE_MOCK=true` (the default in
`.env.example`) it runs entirely on built-in mock data, no backend required.

## 11. Run the backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

With both running, and the frontend's `VITE_USE_MOCK=false`, the Vite dev
server proxies `/api/*` to `http://localhost:8000` (see
`frontend/vite.config.js`), so the frontend just calls relative `/api/...`
URLs — no CORS issue during development.

## 12. Example API requests

```bash
curl "http://localhost:8000/api/search?q=machine+learning&limit=5"
curl "http://localhost:8000/api/graph"
```

## 13. Example response

```json
{
  "query": "machine learning",
  "count": 5,
  "results": [
    { "rank": 1, "id": "ml", "title": "Machine Learning Fundamentals",
      "url": "https://example.edu/wiki/machine-learning",
      "snippet": "An introduction to how machines learn patterns from data...",
      "relevance_score": 0.3765, "pagerank_score": 0.7639, "final_score": 0.4928 }
  ]
}
```

## 14. Future improvements

- Swap TF-IDF for a proper inverted index if the document count grows large
- Add pagination to `/api/search` instead of a flat `limit`
- Persist the dataset in SQLite instead of a JSON file, with an admin
  endpoint to add documents and links without redeploying
- Add snippet highlighting (bold the matched terms) in the frontend
- Cache PageRank and only recompute it when the link graph actually changes
- Rate limiting and structured logging for a production deployment
