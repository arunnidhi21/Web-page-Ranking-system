export default function Footer({ graph }) {
  return <footer className="footer">Controlled dataset: {graph.nodes.length} pages and {graph.edges.length} hyperlinks. This project does not crawl the web.</footer>;
}
