// The only file that talks to the backend. Set VITE_USE_MOCK=false (see .env.example)
// to call the real FastAPI backend instead of the built-in mock data.
//
// The backend's field names (relevance_score, pagerank_score, final_score, label, snippet)
// are mapped to the shape the rest of the app already uses (relevance, pagerank, score, title)
// right here, so no other file needs to know the backend response format changed.
import { mockGraph, mockSearch } from '../data/samplePages.js';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const BASE = import.meta.env.VITE_API_URL || '';

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || body?.error || `API ${res.status}`);
  }
  return res.json();
}

// -> { nodes: [{id,title,url,pagerank,incoming,outgoing}], edges: [{source,target}] }
export async function fetchGraph() {
  if (USE_MOCK) return mockGraph();
  const data = await getJson('/api/graph');
  return {
    nodes: data.nodes.map((n) => ({ id: n.id, title: n.label, url: n.url, pagerank: n.pagerank })),
    edges: data.edges,
  };
}

// -> { query, results: [{id,title,url,relevance,pagerank,score,snippet}] }
export async function fetchSearch(q, limit = 10) {
  if (USE_MOCK) return mockSearch(q);
  const data = await getJson(`/api/search?q=${encodeURIComponent(q)}&limit=${limit}`);
  return {
    query: data.query,
    results: data.results.map((r) => ({
      id: r.id, title: r.title, url: r.url, snippet: r.snippet,
      relevance: r.relevance_score, pagerank: r.pagerank_score, score: r.final_score,
    })),
  };
}
