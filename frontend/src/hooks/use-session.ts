'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { ApiError, message } from '@/utils/errors';
import type { Role, User } from '@/types';

export function useSession(role: Role) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    api<{ user: User }>('/auth/me', { signal: controller.signal })
      .then(({ user }) => {
        if (user.role !== role) router.replace(`/${user.role}`);
        else setUser(user);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) router.replace('/login');
        else setError(message(error));
      });
    return () => controller.abort();
  }, [role, router, attempt]);
  return { user, error, retry: () => setAttempt((value) => value + 1) };
}
