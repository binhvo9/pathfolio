"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import styles from "./portfolio.module.css";

// Performance history view — BACKLOG.md Phase 4's "per portfolio, over
// time" UI, backed by apps/performance-tracking's snapshot history via
// the /api/performance proxy (src/lib/performance-client.ts).
//
// Chart follows the dataviz skill: single series (no legend needed, the
// title names it), 2px line + 10% area wash, hairline gridlines with
// clean-rounded $ ticks, an emphasized end-dot, and a crosshair+tooltip
// hover layer. The hero number above it is the actual "insight" — the
// chart supports it, doesn't replace it.

type Snapshot = {
  value: number;
  valueChangePercent: number;
  assetContributions?: Record<string, number>;
  takenAt: string;
};

type Holding = { symbol: string; weight: number; price: number; changePercent: number };
type ClassPrices = Record<string, { changePercent: number; holdings: Holding[] }>;

const ASSET_LABELS: Record<string, string> = {
  stocks: "Stocks",
  bonds: "Bonds",
  cash: "Cash",
  crypto: "Crypto",
  gold: "Gold",
  realEstate: "Real Estate",
};

const CHART_WIDTH = 560;
const CHART_HEIGHT = 200;
const PAD_LEFT = 56;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;

function niceStep(range: number): number {
  // Round the axis step to a clean-looking number (100/250/500/1000...).
  const roughSteps = [50, 100, 250, 500, 1000, 2500, 5000];
  return roughSteps.find((s) => range / s <= 4) ?? 10000;
}

function PerformanceChart({ snapshots }: { snapshots: Snapshot[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const values = snapshots.map((s) => s.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const step = niceStep(dataMax - dataMin || 1);
  const min = Math.floor(dataMin / step) * step;
  const max = Math.ceil(dataMax / step) * step || step;
  const range = max - min || step;

  const plotW = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  function xFor(i: number) {
    return PAD_LEFT + (snapshots.length === 1 ? plotW / 2 : (i / (snapshots.length - 1)) * plotW);
  }
  function yFor(value: number) {
    return PAD_TOP + plotH - ((value - min) / range) * plotH;
  }

  const linePoints = snapshots.map((s, i) => `${xFor(i)},${yFor(s.value)}`).join(" ");
  const areaPoints = `${xFor(0)},${PAD_TOP + plotH} ${linePoints} ${xFor(snapshots.length - 1)},${PAD_TOP + plotH}`;

  const yTicks = [min, (min + max) / 2, max];

  function handleMove(e: React.PointerEvent<SVGRectElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * CHART_WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    snapshots.forEach((_, i) => {
      const d = Math.abs(xFor(i) - relX);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
    setTooltipPos({ x: (xFor(nearest) / CHART_WIDTH) * rect.width, y: (yFor(snapshots[nearest].value) / CHART_HEIGHT) * rect.height });
  }

  const hovered = hoverIndex !== null ? snapshots[hoverIndex] : null;
  const lastIndex = snapshots.length - 1;

  return (
    <div className={styles.card}>
      <svg
        ref={svgRef}
        className={styles.chart}
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label={`Portfolio value over time, from $${values[0].toFixed(0)} to $${values[lastIndex].toFixed(0)}`}
      >
        {yTicks.map((t) => (
          <g key={t}>
            <line className={styles.gridline} x1={PAD_LEFT} x2={CHART_WIDTH - PAD_RIGHT} y1={yFor(t)} y2={yFor(t)} />
            <text className={styles.axisLabel} x={PAD_LEFT - 8} y={yFor(t) + 3} textAnchor="end">
              ${t.toLocaleString()}
            </text>
          </g>
        ))}
        <text className={styles.axisLabel} x={xFor(0)} y={CHART_HEIGHT - 6} textAnchor="start">
          {new Date(snapshots[0].takenAt).toLocaleDateString()}
        </text>
        <text className={styles.axisLabel} x={xFor(lastIndex)} y={CHART_HEIGHT - 6} textAnchor="end">
          {new Date(snapshots[lastIndex].takenAt).toLocaleDateString()}
        </text>

        <polygon className={styles.area} points={areaPoints} />
        <polyline className={styles.line} points={linePoints} />
        <circle className={styles.endDot} cx={xFor(lastIndex)} cy={yFor(snapshots[lastIndex].value)} r="5" />

        {hoverIndex !== null && (
          <>
            <line
              className={styles.crosshair}
              x1={xFor(hoverIndex)}
              x2={xFor(hoverIndex)}
              y1={PAD_TOP}
              y2={PAD_TOP + plotH}
            />
            <circle
              className={styles.hoverDot}
              cx={xFor(hoverIndex)}
              cy={yFor(snapshots[hoverIndex].value)}
              r="5"
            />
          </>
        )}

        <rect
          className={styles.hitLayer}
          x={PAD_LEFT}
          y={0}
          width={plotW}
          height={CHART_HEIGHT}
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIndex(null)}
        />
      </svg>

      {hovered && tooltipPos && (
        <div className={styles.tooltip} style={{ left: tooltipPos.x, top: tooltipPos.y }}>
          <span className={styles.tooltipValue}>${hovered.value.toFixed(2)}</span> · {new Date(hovered.takenAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// "What moved it" — the latest snapshot's per-asset-class contribution to
// that period's change, so the hero number isn't a black box. Bars are
// colored by sign (helped/hurt), not by asset identity — the name is
// already the direct label, so a categorical hue here would be a second,
// redundant encoding of information the label already carries.
function HoldingsTable({ holdings }: { holdings: Holding[] }) {
  const sorted = [...holdings].sort((a, b) => b.weight - a.weight);
  return (
    <table className={styles.holdingsTable}>
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Weight</th>
          <th>Price</th>
          <th>Change</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((h) => (
          <tr key={h.symbol}>
            <td>{h.symbol}</td>
            <td>{(h.weight * 100).toFixed(0)}%</td>
            <td>${h.price.toFixed(2)}</td>
            <td className={h.changePercent >= 0 ? styles.positive : styles.negative}>
              {h.changePercent >= 0 ? "+" : ""}
              {h.changePercent.toFixed(2)}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ContributionBreakdown({
  contributions,
  holdingsByClass,
}: {
  contributions: Record<string, number>;
  holdingsByClass: ClassPrices | null;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const rows = Object.entries(contributions).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const maxAbs = Math.max(...rows.map(([, v]) => Math.abs(v)), 0.0001);

  return (
    <div className={styles.card}>
      <p className={styles.breakdownTitle}>What moved it this period</p>
      <div className={styles.breakdownRows}>
        {rows.map(([cls, contribution]) => {
          const isPositive = contribution >= 0;
          const widthPercent = (Math.abs(contribution) / maxAbs) * 50;
          const holdings = holdingsByClass?.[cls]?.holdings;
          const drillable = (holdings?.length ?? 0) > 1;
          const isExpanded = expanded === cls;

          return (
            <div key={cls}>
              <button
                type="button"
                className={styles.breakdownRow}
                onClick={drillable ? () => setExpanded(isExpanded ? null : cls) : undefined}
                disabled={!drillable}
                aria-expanded={drillable ? isExpanded : undefined}
              >
                <span className={styles.breakdownLabel}>
                  {drillable && <span className={styles.chevron}>{isExpanded ? "▾" : "▸"}</span>}
                  {ASSET_LABELS[cls] ?? cls}
                </span>
                <div className={styles.breakdownTrack}>
                  <div
                    className={`${styles.breakdownBar} ${isPositive ? styles.breakdownBarPositive : styles.breakdownBarNegative}`}
                    style={
                      isPositive
                        ? { left: "50%", width: `${widthPercent}%` }
                        : { right: "50%", width: `${widthPercent}%` }
                    }
                  />
                  <div className={styles.breakdownMid} />
                </div>
                <span className={`${styles.breakdownValue} ${isPositive ? styles.positive : styles.negative}`}>
                  {isPositive ? "+" : ""}
                  {contribution.toFixed(3)}%
                </span>
              </button>
              {isExpanded && holdings && (
                <div className={styles.holdingsWrap}>
                  <HoldingsTable holdings={holdings} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const { id } = useParams<{ id: string }>();
  const [snapshots, setSnapshots] = useState<Snapshot[] | null>(null);
  const [marketPrices, setMarketPrices] = useState<ClassPrices | null>(null);

  useEffect(() => {
    fetch(`/api/performance/portfolios/${id}/snapshots`)
      .then((res) => res.json())
      .then(setSnapshots);
  }, [id]);

  useEffect(() => {
    // Live holdings for the drill-down — a "right now" view, not
    // historical (the chart above already covers the time dimension;
    // the basket's composition doesn't change day to day, only prices do).
    fetch("/api/market-data/prices")
      .then((res) => res.json())
      .then(setMarketPrices);
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link className={styles.back} href="/dashboard">
          ← Back to dashboard
        </Link>
        <h1 className={styles.title}>Performance history</h1>

        {snapshots === null && <p className={styles.empty}>Loading...</p>}

        {snapshots?.length === 0 && (
          <p className={styles.empty}>
            No snapshots yet — activate this portfolio and check back after the next snapshot cycle.
          </p>
        )}

        {snapshots && snapshots.length === 1 && (
          <p className={styles.empty}>
            Only one snapshot so far (${snapshots[0].value.toFixed(2)}) — check back after the next cycle to see a
            trend.
          </p>
        )}

        {snapshots && snapshots.length > 1 && (
          <>
            {(() => {
              const first = snapshots[0];
              const last = snapshots[snapshots.length - 1];
              const totalChangePercent = ((last.value - first.value) / first.value) * 100;
              const isPositive = totalChangePercent >= 0;
              return (
                <div className={styles.hero}>
                  <span className={styles.heroValue}>${last.value.toFixed(2)}</span>
                  <span className={`${styles.heroDelta} ${isPositive ? styles.positive : styles.negative}`}>
                    {isPositive ? "+" : ""}
                    {totalChangePercent.toFixed(2)}% since ${first.value.toFixed(0)}
                  </span>
                </div>
              );
            })()}
            <p className={styles.heroCaption}>
              {snapshots.length} snapshots · started {new Date(snapshots[0].takenAt).toLocaleDateString()}
            </p>

            {snapshots[snapshots.length - 1].assetContributions && (
              <ContributionBreakdown
                contributions={snapshots[snapshots.length - 1].assetContributions!}
                holdingsByClass={marketPrices}
              />
            )}

            <PerformanceChart snapshots={snapshots} />

            <details className={styles.details}>
              <summary>View all snapshots as a table</summary>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Value</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {[...snapshots].reverse().map((s) => (
                    <tr key={s.takenAt}>
                      <td>{new Date(s.takenAt).toLocaleString()}</td>
                      <td>${s.value.toFixed(2)}</td>
                      <td className={s.valueChangePercent >= 0 ? styles.positive : styles.negative}>
                        {s.valueChangePercent >= 0 ? "+" : ""}
                        {s.valueChangePercent.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        )}
      </div>
    </main>
  );
}
