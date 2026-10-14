// Shown instantly inside the shell while a page's data loads.
export default function Loading() {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Loading">
      <div className="sk sk-title" />
      <div className="sk sk-line" />
      <div className="sk sk-block" />
      <div className="sk-row">
        <div className="sk sk-card" />
        <div className="sk sk-card" />
        <div className="sk sk-card" />
      </div>
    </div>
  );
}
