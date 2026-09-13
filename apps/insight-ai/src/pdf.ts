import PDFDocument from "pdfkit";
import type { Portfolio, Snapshot, RiskProfile } from "./clients";

// docs/specs/07-insight-ai.md's Export behavior: a snapshot of whatever
// data exists right now for one scenario. pdfkit chosen over a
// headless-browser renderer for a single-page report with no styling
// ambition — a plain document, not a pixel-perfect layout.

function localReasoning(portfolio: Portfolio, riskProfile: RiskProfile | null): string {
  const allocationText = Object.entries(portfolio.allocation)
    .map(([cls, pct]) => `${cls} ${pct}%`)
    .join(", ");

  if (!riskProfile?.riskBand) {
    return `This scenario targets the allocation: ${allocationText}. No performance history yet — check back after a few snapshots to see how it's tracking.`;
  }

  return (
    `This scenario is built for a "${riskProfile.riskBand}" risk tolerance with a ` +
    `"${riskProfile.incomeTiltBand}" income preference, spread as: ${allocationText}. ` +
    `No performance history yet — check back after a few snapshots to see how it's tracking.`
  );
}

// No charting library — a handful of pdfkit vector primitives is enough
// for a single value-over-time line, and keeps the dependency list small.
function drawPerformanceChart(doc: PDFKit.PDFDocument, snapshots: Snapshot[]) {
  const chartX = doc.x;
  const chartY = doc.y;
  const chartWidth = 460;
  const chartHeight = 160;

  const values = snapshots.map((s) => s.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  doc
    .moveTo(chartX, chartY)
    .lineTo(chartX, chartY + chartHeight)
    .lineTo(chartX + chartWidth, chartY + chartHeight)
    .stroke("#999999");

  const points = snapshots.map((s, i) => {
    const x = chartX + (i / (snapshots.length - 1 || 1)) * chartWidth;
    const y = chartY + chartHeight - ((s.value - min) / range) * chartHeight;
    return [x, y] as const;
  });

  doc.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) doc.lineTo(x, y);
  doc.stroke("#2563eb");

  doc
    .fontSize(8)
    .fillColor("#666666")
    .text(`$${min.toFixed(0)}`, chartX, chartY + chartHeight + 4)
    .text(`$${max.toFixed(0)}`, chartX + 4, chartY + 2);

  doc.y = chartY + chartHeight + 20;
  doc.fillColor("#000000").fontSize(12);
}

export async function generateReportPdf(
  portfolio: Portfolio,
  snapshots: Snapshot[],
  riskProfile: RiskProfile | null,
  latestInsightText: string | null
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  doc.fontSize(20).text("PathFolio Scenario Report", { align: "left" });
  doc.fontSize(10).fillColor("#666666").text(`Generated ${new Date().toLocaleString("en-NZ")}`);
  doc.moveDown();

  doc.fillColor("#000000").fontSize(16).text(portfolio.name);
  doc.fontSize(10).fillColor("#666666").text(`Status: ${portfolio.status}`);
  doc.moveDown();

  doc.fillColor("#000000").fontSize(12).text("Allocation");
  doc.fontSize(10);
  for (const [cls, pct] of Object.entries(portfolio.allocation)) {
    doc.text(`${cls}: ${pct}%`);
  }
  doc.moveDown();

  if (snapshots.length === 0) {
    doc.fontSize(12).text("Reasoning");
    doc.fontSize(10).text(localReasoning(portfolio, riskProfile));
  } else {
    doc.fontSize(12).text("Performance");
    doc.moveDown(0.5);
    drawPerformanceChart(doc, snapshots);

    doc.fontSize(12).text("Latest insight");
    doc
      .fontSize(10)
      .text(latestInsightText ?? "No comparison has been run for this scenario yet.");
  }

  doc.moveDown();
  doc
    .fontSize(8)
    .fillColor("#999999")
    .text("This is a simulated scenario for demonstration purposes only — not real financial advice.");

  doc.end();
  return done;
}
