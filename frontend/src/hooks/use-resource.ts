'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { ApiError, message } from '@/utils/errors';

export function useResource<T>(path: string, enabled = true, revision = 0) {
  const router = useRouter();
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string }>({
    data: null,
    loading: true,
    error: '',
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setState((previous) => ({ ...previous, loading: true, error: '' }));
    api<T>(path, { signal: controller.signal })
      .then((data) => setState({ data, loading: false, error: '' }))
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) router.replace('/login');
        setState({ data: null, loading: false, error: message(error) });
      });
    return () => controller.abort();
  }, [path, enabled, revision, attempt, router]);
  return { ...state, reload: () => setAttempt((value) => value + 1) };
}
