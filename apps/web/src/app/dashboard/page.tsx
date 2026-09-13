"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ASSET_CLASSES, type AssetClass } from "@pathfolio/shared";
import styles from "./dashboard.module.css";

const ASSET_CLASS_LABEL: Record<AssetClass, string> = {
  stocks: "Stocks",
  bonds: "Bonds",
  cash: "Cash",
  crypto: "Crypto",
  gold: "Gold",
  realEstate: "Real Estate",
};

// Dashboard UI — BACKLOG.md Phase 2's "list of user's scenario
// portfolios", talking to the /api/simulation/portfolios proxy
// (src/lib/simulation-client.ts), which forwards to apps/simulation.
// Lifecycle actions here map to docs/diagrams/state/portfolio-lifecycle.md.

type Scenario = {
  id: string;
  name: string;
  status: "Draft" | "Active" | "Archived";
  allocation: Record<string, number>;
};

const BADGE_CLASS: Record<Scenario["status"], string> = {
  Draft: styles.badgeDraft,
  Active: styles.badgeActive,
  Archived: styles.badgeArchived,
};

type ReportState = { kind: "pending" | "success" | "error"; message: string };

const EMPTY_ALLOCATION_INPUT: Record<AssetClass, string> = {
  stocks: "0",
  bonds: "0",
  cash: "0",
  crypto: "0",
  gold: "0",
  realEstate: "0",
};

export default function DashboardPage() {
  const [scenarios, setScenarios] = useState<Scenario[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [reportState, setReportState] = useState<Record<string, ReportState>>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAllocation, setNewAllocation] = useState<Record<AssetClass, string>>(EMPTY_ALLOCATION_INPUT);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    const res = await fetch("/api/simulation/portfolios");
    setScenarios(await res.json());
  }

  useEffect(() => {
    // load() sets state inside a promise callback (async fetch-on-mount),
    // not synchronously in the effect body — the flagged pattern here is
    // the standard one from React's own docs for syncing with an
    // external system (the API), not the cascading-render anti-pattern
    // the rule targets.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function handleAction(id: string, action: "activate" | "archive" | "delete") {
    if (action === "delete") {
      await fetch(`/api/simulation/portfolios/${id}`, { method: "DELETE" });
    } else {
      await fetch(`/api/simulation/portfolios/${id}/${action}`, { method: "PATCH" });
    }
    load();
  }

  function toggleSelected(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const allocationSum = ASSET_CLASSES.reduce((sum, cls) => sum + (Number(newAllocation[cls]) || 0), 0);
  const allocationValid = Math.abs(allocationSum - 100) < 0.5;

  async function handleCreateScenario() {
    setCreateError(null);
    if (!newName.trim()) {
      setCreateError("Give the scenario a name");
      return;
    }
    if (!allocationValid) {
      setCreateError(`Allocation must sum to 100 (currently ${allocationSum})`);
      return;
    }

    setCreating(true);
    try {
      const allocation = Object.fromEntries(ASSET_CLASSES.map((cls) => [cls, Number(newAllocation[cls]) || 0]));
      const res = await fetch("/api/simulation/portfolios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), allocation }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? "Something went wrong");
        return;
      }
      setShowNewForm(false);
      setNewName("");
      setNewAllocation(EMPTY_ALLOCATION_INPUT);
      load();
    } catch {
      setCreateError("Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  async function handleReportAction(id: string, action: "export" | "email") {
    setReportState((prev) => ({ ...prev, [id]: { kind: "pending", message: action === "export" ? "Exporting..." : "Sending..." } }));

    try {
      const res = await fetch(`/api/insight/portfolios/${id}/${action}`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setReportState((prev) => ({ ...prev, [id]: { kind: "error", message: data.error ?? "Something went wrong" } }));
        return;
      }

      if (action === "export") {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
      setReportState((prev) => ({ ...prev, [id]: { kind: "success", message: action === "export" ? "Opened in a new tab" : "Sent!" } }));
    } catch {
      setReportState((prev) => ({ ...prev, [id]: { kind: "error", message: "Something went wrong" } }));
    } finally {
      setTimeout(() => {
        setReportState((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => key !== id)));
      }, 4000);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Your portfolios</h1>
          <button className={styles.newButton} onClick={() => setShowNewForm((prev) => !prev)}>
            {showNewForm ? "Cancel" : "+ New scenario"}
          </button>
        </div>

        {showNewForm && (
          <div className={styles.newForm}>
            <label className={styles.fieldLabel}>
              Name
              <input
                className={styles.textInput}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Aggressive Growth"
              />
            </label>

            <div className={styles.allocationGrid}>
              {ASSET_CLASSES.map((cls) => (
                <label className={styles.fieldLabel} key={cls}>
                  {ASSET_CLASS_LABEL[cls]}
                  <input
                    className={styles.numberInput}
                    type="number"
                    min={0}
                    max={100}
                    value={newAllocation[cls]}
                    onChange={(e) => setNewAllocation((prev) => ({ ...prev, [cls]: e.target.value }))}
                  />
                </label>
              ))}
            </div>

            <p className={allocationValid ? styles.allocationSumOk : styles.allocationSumBad}>
              Total: {allocationSum}% {allocationValid ? "✓" : "(must be 100%)"}
            </p>

            {createError && <p className={styles.reportStatusError}>{createError}</p>}

            <button className={styles.compareButton} disabled={creating} onClick={handleCreateScenario}>
              {creating ? "Creating..." : "Create scenario"}
            </button>
          </div>
        )}

        {scenarios === null && <p className={styles.empty}>Loading...</p>}
        {scenarios?.length === 0 && (
          <p className={styles.empty}>No scenarios yet — complete onboarding to create your first one.</p>
        )}

        {scenarios?.map((s) => (
          <div className={styles.card} key={s.id}>
            <div className={styles.cardHeader}>
              <label className={styles.compareCheckbox}>
                <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleSelected(s.id)} />
              </label>
              <Link className={styles.name} href={`/portfolio/${s.id}`}>
                {s.name}
              </Link>
              <span className={`${styles.badge} ${BADGE_CLASS[s.status]}`}>{s.status}</span>
            </div>
            <div className={styles.actions}>
              {s.status === "Draft" && (
                <button className={styles.actionButton} onClick={() => handleAction(s.id, "activate")}>
                  Activate
                </button>
              )}
              {s.status !== "Archived" && (
                <button className={styles.actionButton} onClick={() => handleAction(s.id, "archive")}>
                  Archive
                </button>
              )}
              <button
                className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                onClick={() => handleAction(s.id, "delete")}
              >
                Delete
              </button>
              <button
                className={styles.actionButton}
                disabled={reportState[s.id]?.kind === "pending"}
                onClick={() => handleReportAction(s.id, "export")}
              >
                Export PDF
              </button>
              <button
                className={styles.actionButton}
                disabled={reportState[s.id]?.kind === "pending"}
                onClick={() => handleReportAction(s.id, "email")}
              >
                Email report
              </button>
            </div>
            {reportState[s.id] && (
              <p
                className={reportState[s.id].kind === "error" ? styles.reportStatusError : styles.reportStatus}
                role="status"
              >
                {reportState[s.id].message}
              </p>
            )}
          </div>
        ))}

        {selected.length >= 2 && (
          <Link className={styles.compareButton} href={`/compare?ids=${selected.join(",")}`}>
            Compare {selected.length} selected scenarios
          </Link>
        )}
      </div>
    </main>
  );
}
