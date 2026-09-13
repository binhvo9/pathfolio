"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./compare.module.css";

// Scenario comparison view — BACKLOG.md Phase 5's "chart + AI insight
// text", triggered from the dashboard's multi-select checkboxes.
//
// Multi-series line chart follows the dataviz skill's rules for 2+
// series: a legend is always present (never rely on color-matching
// alone), colors are assigned in a fixed order (never cycled/re-painted
// by rank), 2px lines, hairline gridlines.

const SERIES_COLORS = ["#2f6f5e", "#b5762a", "#3b5fa0", "#8a3b8a"];

type Scenario = { id: string; name: string };
type Snapshot = { value: number; takenAt: string };

const CHART_WIDTH = 600;
const CHART_HEIGHT = 220;
const PAD_LEFT = 56;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;

function niceStep(range: number): number {
  const roughSteps = [50, 100, 250, 500, 1000, 2500, 5000];
  return roughSteps.find((s) => range / s <= 4) ?? 10000;
}

function ComparisonChart({ series }: { series: { name: string; snapshots: Snapshot[] }[] }) {
  const withData = series.filter((s) => s.snapshots.length > 0);
  const allValues = withData.flatMap((s) => s.snapshots.map((snap) => snap.value));
  const allTimes = withData.flatMap((s) => s.snapshots.map((snap) => new Date(snap.takenAt).getTime()));

  if (allValues.length === 0) {
    return <p className={styles.empty}>None of these scenarios have snapshots yet.</p>;
  }

  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const step = niceStep(dataMax - dataMin || 1);
  const min = Math.floor(dataMin / step) * step;
  const max = Math.ceil(dataMax / step) * step || step;
  const range = max - min || step;

  const minTime = Math.min(...allTimes);
  const maxTime = Math.max(...allTimes);
  const timeRange = maxTime - minTime || 1;

  const plotW = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  function xFor(time: number) {
    return PAD_LEFT + ((time - minTime) / timeRange) * plotW;
  }
  function yFor(value: number) {
    return PAD_TOP + plotH - ((value - min) / range) * plotH;
  }

  const yTicks = [min, (min + max) / 2, max];

  return (
    <svg
      className={styles.chart}
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      role="img"
      aria-label={`Comparison of ${series.length} scenarios' value over time`}
    >
      {yTicks.map((t) => (
        <g key={t}>
          <line className={styles.gridline} x1={PAD_LEFT} x2={CHART_WIDTH - PAD_RIGHT} y1={yFor(t)} y2={yFor(t)} />
          <text className={styles.axisLabel} x={PAD_LEFT - 8} y={yFor(t) + 3} textAnchor="end">
            ${t.toLocaleString()}
          </text>
        </g>
      ))}
      <text className={styles.axisLabel} x={PAD_LEFT} y={CHART_HEIGHT - 6} textAnchor="start">
        {new Date(minTime).toLocaleDateString()}
      </text>
      <text className={styles.axisLabel} x={CHART_WIDTH - PAD_RIGHT} y={CHART_HEIGHT - 6} textAnchor="end">
        {new Date(maxTime).toLocaleDateString()}
      </text>

      {series.map((s, i) => {
        if (s.snapshots.length === 0) return null;
        const color = SERIES_COLORS[i % SERIES_COLORS.length];
        const points = s.snapshots
          .map((snap) => `${xFor(new Date(snap.takenAt).getTime())},${yFor(snap.value)}`)
          .join(" ");
        const last = s.snapshots[s.snapshots.length - 1];
        return (
          <g key={s.name}>
            <polyline fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" points={points} />
            <circle cx={xFor(new Date(last.takenAt).getTime())} cy={yFor(last.value)} r="5" fill={color} stroke="white" strokeWidth="2" />
          </g>
        );
      })}
    </svg>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<main className={styles.page} />}>
      <ComparePageInner />
    </Suspense>
  );
}

function ComparePageInner() {
  const searchParams = useSearchParams();
  const ids = (searchParams.get("ids") ?? "").split(",").filter(Boolean);

  const [seriesData, setSeriesData] = useState<{ name: string; snapshots: Snapshot[] }[] | null>(null);
  const [insightText, setInsightText] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/simulation/portfolios")
      .then((res) => res.json())
      .then((all: Scenario[]) => {
        const selected = all.filter((s) => ids.includes(s.id));
        return Promise.all(
          selected.map((s) =>
            fetch(`/api/performance/portfolios/${s.id}/snapshots`)
              .then((res) => res.json())
              .then((snapshots: Snapshot[]) => ({ name: s.name, snapshots }))
          )
        );
      })
      .then(setSeriesData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ids.length < 2) return;
    fetch("/api/insight/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portfolioIds: ids }),
    })
      .then((res) => res.json())
      .then((data) => setInsightText(data.insightText));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link className={styles.back} href="/dashboard">
          ← Back to dashboard
        </Link>
        <h1 className={styles.title}>Comparing {ids.length} scenarios</h1>

        {seriesData === null && <p className={styles.empty}>Loading...</p>}

        {seriesData && (
          <div className={styles.card}>
            <div className={styles.legend}>
              {seriesData.map((s, i) => (
                <span className={styles.legendItem} key={s.name}>
                  <span className={styles.legendSwatch} style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }} />
                  {s.name}
                </span>
              ))}
            </div>
            <ComparisonChart series={seriesData} />
          </div>
        )}

        <div className={styles.insightCard}>
          <p className={styles.insightTitle}>What Gemini thinks</p>
          {insightText === null ? (
            <p className={styles.loadingInsight}>Thinking it over...</p>
          ) : (
            <p className={styles.insightText}>{insightText}</p>
          )}
        </div>
      </div>
    </main>
  );
}
