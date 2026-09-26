const LINKS = ['home', 'search', 'ranking', 'graph', 'algorithm', 'about'];
export default function Navbar() {
  return (
    <nav className="nav" aria-label="Main">
      <a href="#home" className="brand">WEBRANK</a>
      <ul>{LINKS.map((l) => <li key={l}><a href={`#${l}`}>{l}</a></li>)}</ul>
    </nav>
  );
}
