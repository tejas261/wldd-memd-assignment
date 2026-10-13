'use client';

import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="center-screen">
      <h1>That didn’t load.</h1>
      <p>Please try opening this page again.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
