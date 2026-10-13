'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="center-screen">
      <h1>That didn’t load.</h1>
      <p>Please try opening this page again.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
