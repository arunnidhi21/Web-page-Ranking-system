import { useState } from 'react';
export default function SearchBar({ onSearch, busy, initial = '' }) {
  const [value, setValue] = useState(initial);
  return (
    <form className="searchbar" onSubmit={(e) => { e.preventDefault(); onSearch(value); }}>
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Search the digital web…" aria-label="Search query" />
      <button className="btn" type="submit" disabled={busy || !value.trim()}>Search</button>
    </form>
  );
}
