'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutGrid, LogOut } from 'lucide-react';
import type { Role, User } from '@/types';
import { api } from '@/utils/api';
import { message } from '@/utils/errors';
import { ErrorNotice, Logo } from './ui';
import { Skeleton } from './skeletons';

export function Shell({
  user,
  role,
  children,
}: {
  user: User | null;
  role: Role;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await api('/auth/logout', { method: 'POST', body: '{}' });
      router.replace('/login');
    } catch (error) {
      setError(message(error));
      setBusy(false);
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <Logo />
        <div className="workspace-label">{role === 'brand' ? 'Brand' : 'Creator'} workspace</div>
        <nav aria-label="Main navigation">
          <Link className="nav-item active" href={`/${role}`} aria-current="page">
            <LayoutGrid size={18} />
            Dashboard
          </Link>
        </nav>
        <div className="profile" aria-busy={!user}>
          {user ? (
            <>
              <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>{user.name}</strong>
                <span>{user.role === 'brand' ? 'Brand account' : 'Creator account'}</span>
              </div>
              <button
                className="icon-button"
                title="Log out"
                aria-label="Log out"
                disabled={busy}
                onClick={logout}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Skeleton className="avatar" width={32} height={32} />
              <div className="skeleton-stack">
                <Skeleton width={90} />
                <Skeleton width={70} height={11} />
              </div>
              <span className="sr-only" role="status">
                Loading account…
              </span>
            </>
          )}
        </div>
      </aside>
      <div className="workspace">
        <main id="main" className="main-content">
          {error && <ErrorNotice error={error} />} {children}
        </main>
      </div>
    </div>
  );
}
