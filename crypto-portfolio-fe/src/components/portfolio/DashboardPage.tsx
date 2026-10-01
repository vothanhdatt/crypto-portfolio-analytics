const milestones = [
  "CSV import and atomic validation",
  "Weighted-average portfolio calculation",
  "Holdings, charts, and transaction explorer",
];

export function DashboardPage() {
  return (
    <section className="dashboard-grid" aria-labelledby="dashboard-title">
      <div className="hero-card">
        <p className="eyebrow">Assessment workspace</p>
        <h2 id="dashboard-title">The BE/FE foundation is ready.</h2>
        <p>
          The project now follows the Bot Farm separation while keeping the financial domain isolated from presentation code.
        </p>
      </div>

      <aside className="milestone-card" aria-labelledby="next-title">
        <p className="eyebrow">Next milestones</p>
        <h2 id="next-title">Implementation queue</h2>
        <ol>
          {milestones.map((milestone) => (
            <li key={milestone}>{milestone}</li>
          ))}
        </ol>
      </aside>
    </section>
  );
}

