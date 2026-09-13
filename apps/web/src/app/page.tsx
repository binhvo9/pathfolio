import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <h1>PathFolio</h1>
      <p>Robo-advisor simulator for beginner NZ investors.</p>
      <Link href="/onboarding" className={styles.button}>
        Start onboarding →
      </Link>
    </main>
  );
}
