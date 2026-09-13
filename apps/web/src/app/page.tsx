import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <h1>PathFolio</h1>
      <p>Robo-advisor simulator for beginner NZ investors.</p>
      <Link href="/onboarding">Start onboarding →</Link>
    </main>
  );
}
