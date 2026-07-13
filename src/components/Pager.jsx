export default function Pager({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);

  return (
    <nav className="pager" aria-label="Pagination">
      <button
        type="button"
        className="pager-btn"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        Prev
      </button>
      {pages.map((p) => (
        <button
          type="button"
          key={p}
          className={"pager-btn" + (p === page ? " is-active" : "")}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        className="pager-btn"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
