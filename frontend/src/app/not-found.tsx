import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="center-screen">
      <span className="eyebrow">404</span>
      <h1>Nothing to see here.</h1>
      <Link className="button primary" href="/">
        Back to Meme’d
      </Link>
    </main>
  );
}
