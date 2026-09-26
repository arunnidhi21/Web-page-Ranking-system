// Mock dataset: 12 pages and their hyperlinks. Replace with GET /api/graph and GET /api/search later.
// Shapes match the planned backend responses, so components never need to change.
const PAGES = [
  { id: 'ml', title: 'Machine Learning Fundamentals', url: '/pages/ml', tags: ['machine', 'learning', 'models'], base: 0.9 },
  { id: 'nn', title: 'Neural Networks Explained', url: '/pages/neural-networks', tags: ['neural', 'networks', 'learning'], base: 0.85 },
  { id: 'dl', title: 'Deep Learning Guide', url: '/pages/deep-learning', tags: ['deep', 'learning', 'neural'], base: 0.82 },
  { id: 'py', title: 'Python for Data Science', url: '/pages/python', tags: ['python', 'data', 'science'], base: 0.7 },
  { id: 'gd', title: 'Gradient Descent Explained', url: '/pages/gradient-descent', tags: ['gradient', 'descent', 'optimization', 'learning'], base: 0.72 },
  { id: 'np', title: 'NumPy Handbook', url: '/pages/numpy', tags: ['numpy', 'arrays', 'python'], base: 0.6 },
  { id: 'sk', title: 'Scikit-learn Tutorial', url: '/pages/scikit-learn', tags: ['scikit-learn', 'machine', 'learning', 'python'], base: 0.78 },
  { id: 'gt', title: 'Graph Theory Basics', url: '/pages/graph-theory', tags: ['graph', 'theory', 'nodes'], base: 0.65 },
  { id: 'pr', title: 'The PageRank Algorithm', url: '/pages/pagerank', tags: ['pagerank', 'graph', 'search', 'ranking'], base: 0.8 },
  { id: 'se', title: 'Search Engine Design', url: '/pages/search-engines', tags: ['search', 'engine', 'ranking'], base: 0.75 },
  { id: 'la', title: 'Linear Algebra Primer', url: '/pages/linear-algebra', tags: ['linear', 'algebra', 'matrix'], base: 0.6 },
  { id: 'st', title: 'Introduction to Statistics', url: '/pages/statistics', tags: ['statistics', 'probability', 'data'], base: 0.55 },
];

// [from, to] means page "from" contains a hyperlink to page "to".
const LINKS = [
  ['ml','nn'],['ml','dl'],['ml','py'],['ml','gd'],['ml','sk'],['ml','st'],
  ['nn','ml'],['nn','dl'],['nn','gd'],['nn','la'],
  ['dl','ml'],['dl','nn'],['dl','py'],
  ['py','np'],['py','sk'],['py','ml'],
  ['gd','ml'],['gd','la'],['gd','np'],
  ['np','la'],['np','py'],
  ['sk','ml'],['sk','py'],['sk','np'],['sk','st'],
  ['gt','pr'],['gt','la'],
  ['pr','gt'],['pr','se'],['pr','la'],['pr','ml'],
  ['se','pr'],['se','gt'],['se','ml'],
  ['la','ml'],['la','st'],
  ['st','ml'],['st','la'],
];

// Power-iteration PageRank: PR(p) = (1-d)/N + d * sum(PR(q)/L(q)) over pages q linking to p.
function computePageRank(ids, links, d = 0.85, iterations = 60, history = null) {
  const n = ids.length;
  let pr = Object.fromEntries(ids.map((id) => [id, 1 / n]));
  history?.push({ ...pr });
  const outCount = Object.fromEntries(ids.map((id) => [id, links.filter((l) => l[0] === id).length]));
  for (let k = 0; k < iterations; k++) {
    const next = Object.fromEntries(ids.map((id) => [id, (1 - d) / n]));
    ids.forEach((id) => { if (outCount[id] === 0) ids.forEach((o) => (next[o] += (d * pr[id]) / n)); }); // dangling page
    links.forEach(([from, to]) => (next[to] += (d * pr[from]) / outCount[from]));
    pr = next;
    history?.push({ ...pr });
  }
  return pr;
}

// Same shape as GET /api/graph. PageRank is normalised to the top page (1.0) so it can drive node size.
export function mockGraph() {
  const raw = computePageRank(PAGES.map((p) => p.id), LINKS);
  const max = Math.max(...Object.values(raw));
  return {
    nodes: PAGES.map((p) => ({ id: p.id, title: p.title, url: p.url, pagerank: raw[p.id] / max })),
    edges: LINKS.map(([source, target]) => ({ source, target })),
  };
}

// Adds incoming/outgoing link lists to a graph (works for mock or API data).
export function enrichGraph(graph) {
  const incoming = {}, outgoing = {};
  graph.nodes.forEach((n) => { incoming[n.id] = []; outgoing[n.id] = []; });
  graph.edges.forEach((e) => { incoming[e.target]?.push(e.source); outgoing[e.source]?.push(e.target); });
  return { edges: graph.edges, nodes: graph.nodes.map((n) => ({ ...n, incoming: incoming[n.id] || [], outgoing: outgoing[n.id] || [] })) };
}

export const authorityLevel = (pr) => (pr >= 0.66 ? 'HIGH' : pr >= 0.33 ? 'MEDIUM' : 'LOW');

// Same shape as GET /api/search?q=... (plus `id`). Relevance here is simple tag overlap; a backend would use TF-IDF.
export function mockSearch(query, alpha = 0.5) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const pagerank = Object.fromEntries(mockGraph().nodes.map((n) => [n.id, n.pagerank]));
  const results = PAGES.map((p) => {
    const hits = terms.filter((t) => p.tags.includes(t)).length;
    const relevance = hits ? Math.min(0.99, 0.6 * (hits / terms.length) + 0.4 * p.base) : 0.25 * p.base;
    return { id: p.id, title: p.title, url: p.url, relevance, pagerank: pagerank[p.id], score: alpha * relevance + (1 - alpha) * pagerank[p.id] };
  }).sort((a, b) => b.score - a.score).slice(0, 6);
  return { query, results };
}

// PageRank of the given pages after each iteration (0..iterations). Same algorithm as above, for the convergence chart.
export function convergenceHistory(graph, ids, d = 0.85, iterations = 25) {
  const history = [];
  computePageRank(graph.nodes.map((n) => n.id), graph.edges.map((e) => [e.source, e.target]), d, iterations, history);
  return ids.map((id) => history.map((h) => h[id]));
}
