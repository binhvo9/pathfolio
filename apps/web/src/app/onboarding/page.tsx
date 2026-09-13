"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import styles from "./onboarding.module.css";

// Onboarding flow — docs/diagrams/wireframes/onboarding-flow.md, screens 1-7.
// Talks to GET/POST /api/onboarding/questionnaire (OnboardingController).

type Option = { value: string; label: string };
type QuestionDef =
  | { id: "goal" | "riskTolerance" | "incomeNeed"; label: string; options: readonly Option[] }
  | { id: "timeHorizonYears"; label: string; inputType: "slider"; min: number; max: number };

type Answers = {
  goal?: string;
  timeHorizonYears?: number;
  riskTolerance?: string;
  incomeNeed?: string;
};

type AllocationResult = {
  riskBand: string;
  incomeTiltBand: string;
  defaultAllocation: Record<string, number>;
};

const ASSET_LABELS: Record<string, string> = {
  stocks: "Stocks",
  bonds: "Bonds",
  cash: "Cash",
  crypto: "Crypto",
  gold: "Gold",
  realEstate: "Real Estate",
};

export default function OnboardingPage() {
  const { status } = useSession();
  const [questions, setQuestions] = useState<QuestionDef[]>([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ timeHorizonYears: 5 });
  const [result, setResult] = useState<AllocationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/onboarding/questionnaire")
      .then((res) => res.json())
      .then((data) => setQuestions(data.questions));
  }, []);

  // Screen 2 (sign in) is skipped once already authenticated, per the
  // sequence diagram (session established before questions are asked).
  // Derived at render time, not via effect+setState, to avoid a
  // cascading re-render.
  const effectiveStep = status === "authenticated" && step < 2 ? 2 : step;

  async function submitQuestionnaire() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      if (!res.ok) throw new Error("Something went wrong, please try again.");
      const data = await res.json();
      setResult({
        riskBand: data.riskBand,
        incomeTiltBand: data.incomeTiltBand,
        defaultAllocation: data.defaultAllocation,
      });
      setStep(6);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const goalQ = questions.find((q) => q.id === "goal");
  const riskQ = questions.find((q) => q.id === "riskTolerance");
  const incomeQ = questions.find((q) => q.id === "incomeNeed");
  const timeQ = questions.find((q) => q.id === "timeHorizonYears");

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <span className={styles.step}>STEP {effectiveStep + 1} / 7</span>

        {effectiveStep === 0 && (
          <>
            <h1 className={styles.title}>
              Hey, let&apos;s get you started with simple, jargon-free investing.
            </h1>
            <button className={styles.button} onClick={() => setStep(1)}>
              Get started
            </button>
          </>
        )}

        {effectiveStep === 1 && (
          <>
            <h1 className={styles.title}>Sign in</h1>
            <button className={styles.button} onClick={() => signIn("google")}>
              Sign in with Google
            </button>
            <button className={styles.button} onClick={() => signIn("github")}>
              Sign in with GitHub
            </button>
          </>
        )}

        {effectiveStep === 2 && goalQ && "options" in goalQ && (
          <>
            <h1 className={styles.title}>{goalQ.label}</h1>
            <div className={styles.options}>
              {goalQ.options.map((opt) => (
                <div
                  key={opt.value}
                  className={`${styles.option} ${answers.goal === opt.value ? styles.optionSelected : ""}`}
                  onClick={() => setAnswers({ ...answers, goal: opt.value })}
                >
                  {opt.label}
                </div>
              ))}
            </div>
            <button className={styles.button} disabled={!answers.goal} onClick={() => setStep(3)}>
              Next
            </button>
          </>
        )}

        {effectiveStep === 3 && timeQ && "inputType" in timeQ && (
          <>
            <h1 className={styles.title}>{timeQ.label}</h1>
            <input
              className={styles.slider}
              type="range"
              min={timeQ.min}
              max={timeQ.max}
              value={answers.timeHorizonYears ?? timeQ.min}
              onChange={(e) => setAnswers({ ...answers, timeHorizonYears: Number(e.target.value) })}
            />
            <div className={styles.sliderValue}>{answers.timeHorizonYears} years</div>
            <button className={styles.button} onClick={() => setStep(4)}>
              Next
            </button>
          </>
        )}

        {effectiveStep === 4 && riskQ && "options" in riskQ && (
          <>
            <h1 className={styles.title}>{riskQ.label}</h1>
            <div className={styles.options}>
              {riskQ.options.map((opt) => (
                <div
                  key={opt.value}
                  className={`${styles.option} ${answers.riskTolerance === opt.value ? styles.optionSelected : ""}`}
                  onClick={() => setAnswers({ ...answers, riskTolerance: opt.value })}
                >
                  {opt.label}
                </div>
              ))}
            </div>
            <button className={styles.button} disabled={!answers.riskTolerance} onClick={() => setStep(5)}>
              Next
            </button>
          </>
        )}

        {effectiveStep === 5 && incomeQ && "options" in incomeQ && (
          <>
            <h1 className={styles.title}>{incomeQ.label}</h1>
            <div className={styles.options}>
              {incomeQ.options.map((opt) => (
                <div
                  key={opt.value}
                  className={`${styles.option} ${answers.incomeNeed === opt.value ? styles.optionSelected : ""}`}
                  onClick={() => setAnswers({ ...answers, incomeNeed: opt.value })}
                >
                  {opt.label}
                </div>
              ))}
            </div>
            {error && <span className={styles.error}>{error}</span>}
            <button
              className={styles.button}
              disabled={!answers.incomeNeed || submitting}
              onClick={submitQuestionnaire}
            >
              {submitting ? "Calculating..." : "See my results"}
            </button>
          </>
        )}

        {effectiveStep === 6 && result && (
          <>
            <h1 className={styles.title}>Your default allocation</h1>
            <p className={styles.subtitle}>
              Your profile: {result.riskBand} · {result.incomeTiltBand}
            </p>
            {Object.entries(result.defaultAllocation).map(([asset, pct]) => (
              <div className={styles.allocationRow} key={asset}>
                <span className={styles.allocationLabel}>{ASSET_LABELS[asset] ?? asset}</span>
                <div className={styles.allocationBarTrack}>
                  <div className={styles.allocationBarFill} style={{ width: `${pct}%` }} />
                </div>
                <span className={styles.allocationValue}>{pct.toFixed(0)}%</span>
              </div>
            ))}
            <p className={styles.subtitle}>
              Your first portfolio is being created in the background with this allocation (takes a few seconds).
            </p>
            <Link className={styles.button} href="/dashboard" style={{ textAlign: "center" }}>
              Go to dashboard
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
