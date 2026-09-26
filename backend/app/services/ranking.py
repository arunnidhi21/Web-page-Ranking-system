"""
Loads the sample document collection once at startup and exposes:

- search(query, limit): TF-IDF relevance + PageRank -> ranked results
- graph(): the full link graph with PageRank, for the 3D visualization

Kept as one small module (rather than split into many files) because the whole
pipeline is short enough to read start-to-finish, which matters for a student
portfolio project that graders will actually open.
"""
import json
import os
from dataclasses import dataclass

import networkx as nx
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.config import get_settings

DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "dataset.json")


@dataclass
class Document:
    id: str
    title: str
    url: str
    description: str
    content: str
    links: list[str]


class RankingService:
    def __init__(self, dataset_path: str = DATASET_PATH):
        self.documents: list[Document] = self._load_documents(dataset_path)
        self.id_to_index = {d.id: i for i, d in enumerate(self.documents)}

        # TF-IDF over title + description + content, weighted toward title/description
        # by repeating them, so a query matching the title ranks a bit higher.
        corpus = [f"{d.title} {d.title} {d.description} {d.description} {d.content}" for d in self.documents]
        self.vectorizer = TfidfVectorizer(stop_words="english")
        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)

        self.graph_nx = self._build_graph()
        self.pagerank_raw = self._compute_pagerank()
        self.incoming, self.outgoing = self._link_counts()

    # ---------- setup ----------

    @staticmethod
    def _load_documents(path: str) -> list[Document]:
        with open(path) as f:
            raw = json.load(f)
        docs = [Document(id=d["id"], title=d["title"], url=d["url"], description=d["description"],
                          content=d["content"], links=d["links"]) for d in raw]
        if not docs:
            raise ValueError("dataset.json contains no documents")
        return docs

    def _build_graph(self) -> nx.DiGraph:
        g = nx.DiGraph()
        g.add_nodes_from(d.id for d in self.documents)
        for d in self.documents:
            for target in d.links:
                if target in self.id_to_index:
                    g.add_edge(d.id, target)
        return g

    def _compute_pagerank(self) -> dict[str, float]:
        settings = get_settings()
        try:
            return nx.pagerank(self.graph_nx, alpha=settings.pagerank_damping)
        except nx.PowerIterationFailedConvergence:
            # Extremely unlikely on a graph this small, but fall back to a uniform
            # score rather than letting the whole API request fail.
            n = len(self.documents)
            return {d.id: 1 / n for d in self.documents}

    def _link_counts(self) -> tuple[dict[str, int], dict[str, int]]:
        incoming = {d.id: self.graph_nx.in_degree(d.id) for d in self.documents}
        outgoing = {d.id: self.graph_nx.out_degree(d.id) for d in self.documents}
        return incoming, outgoing

    # ---------- public API ----------

    def search(self, query: str, limit: int = 10) -> list[dict]:
        """Returns ranked result dicts (rank, id, title, url, snippet, relevance_score,
        pagerank_score, final_score), highest final_score first."""
        settings = get_settings()
        query_vec = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        max_pr = max(self.pagerank_raw.values()) or 1.0  # normalize PageRank to 0..1 for scoring
        scored = []
        for i, doc in enumerate(self.documents):
            relevance = float(similarities[i])
            if relevance <= 0:
                continue
            pagerank_norm = self.pagerank_raw[doc.id] / max_pr
            final = settings.relevance_weight * relevance + settings.pagerank_weight * pagerank_norm
            scored.append((final, relevance, pagerank_norm, doc))

        scored.sort(key=lambda t: t[0], reverse=True)
        results = []
        for rank, (final, relevance, pagerank_norm, doc) in enumerate(scored[:limit], start=1):
            results.append({
                "rank": rank, "id": doc.id, "title": doc.title, "url": doc.url,
                "snippet": doc.description, "relevance_score": round(relevance, 4),
                "pagerank_score": round(pagerank_norm, 4), "final_score": round(final, 4),
            })
        return results

    def graph_data(self) -> dict:
        max_pr = max(self.pagerank_raw.values()) or 1.0
        nodes = [{
            "id": d.id, "label": d.title, "url": d.url,
            "pagerank": round(self.pagerank_raw[d.id] / max_pr, 4),
            "incoming": self.incoming[d.id], "outgoing": self.outgoing[d.id],
        } for d in self.documents]
        edges = [{"source": s, "target": t} for s, t in self.graph_nx.edges()]
        return {"nodes": nodes, "edges": edges}


_service: RankingService | None = None


def get_ranking_service() -> RankingService:
    """Lazily builds the service once and reuses it (the TF-IDF matrix and
    PageRank scores are cheap for this dataset size but there's no reason to
    recompute them on every request)."""
    global _service
    if _service is None:
        _service = RankingService()
    return _service
