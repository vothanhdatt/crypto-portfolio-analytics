import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell min-h-screen">
      <header className="topbar">
        <div>
          <p className="eyebrow">Portfolio intelligence</p>
          <h1>Crypto Portfolio Analytics</h1>
        </div>
        <span className="status-chip">
          <span className="status-dot" aria-hidden="true" />
          Weighted-average view
        </span>
      </header>
      <main>{children}</main>
    </div>
  );
}
