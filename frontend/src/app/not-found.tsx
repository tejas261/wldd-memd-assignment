import Link from 'next/link';
import { Button } from '@/components/ui/button';
export default function NotFound() {
  return (
    <main className="center-screen">
      <span className="eyebrow">404</span>
      <h1>Nothing to see here.</h1>
      <Button asChild>
        <Link href="/">Back to Meme’d</Link>
      </Button>
    </main>
  );
}
