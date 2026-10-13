'use client';

import { useEffect, useId, useRef } from 'react';
import {
  ArrowDownLeft,
  Camera,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
} from 'lucide-react';
import { money, shortNumber } from '@/utils/format';
import type { Campaign, Milestone } from '@/types';

export function Logo() {
  return (
    <span className="logo">
      <span className="logo-mark">m</span> Meme’d
    </span>
  );
}
export function ErrorNotice({ error, retry }: { error: string; retry?: () => void }) {
  return (
    <div className="notice error" role="alert">
      <CircleAlert size={18} />
      <span>{error}</span>
      {retry && (
        <button className="text-button" onClick={retry}>
          Retry
        </button>
      )}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="spinner" /> Loading…
    </div>
  );
}
export function Empty({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="empty">
      <ArrowDownLeft size={28} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id={id}>{title}</h2>
        <button className="icon-button" aria-label="Close dialog" disabled={busy} onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <strong>{value}</strong>
      <span>{note}</span>
    </div>
  );
}
export function Platform({ value }: { value: Campaign['platform'] }) {
  return (
    <span className={`platform ${value}`}>
      {value === 'instagram' ? <Camera size={15} /> : <Play size={15} />}{' '}
      {value === 'instagram' ? 'Instagram' : 'YouTube'}
    </span>
  );
}
export function Ladder({ milestones }: { milestones: Milestone[] }) {
  return (
    <div className="ladder" aria-label="Payout milestones">
      <div className="ladder-label">
        <span>Views</span>
        <span>Total payout</span>
      </div>
      {milestones.map((milestone) => (
        <div className="ladder-step" key={milestone.views}>
          <span>{shortNumber(milestone.views)}</span>
          <strong>{money(milestone.payout)}</strong>
        </div>
      ))}
    </div>
  );
}
export function CampaignCard({
  campaign,
  children,
}: {
  campaign: Campaign;
  children: React.ReactNode;
}) {
  const remaining = Math.max(0, campaign.budget - campaign.spent);
  return (
    <article className="campaign-card">
      <div className="campaign-description">
        <div className="card-top">
          <Platform value={campaign.platform} />
          <span className={`status ${remaining > 0 ? 'live' : ''}`}>
            <i />
            {remaining > 0 ? 'Live' : 'Budget used'}
          </span>
        </div>
        <h3>{campaign.name}</h3>
        <div className="budget-info">
          <span>{money(remaining)} left</span>
          <span className="muted">of {money(campaign.budget)}</span>
        </div>
        <progress
          className="budget-bar"
          value={campaign.spent}
          max={campaign.budget}
          aria-label={`${campaign.name} budget spent`}
        />
      </div>
      <Ladder milestones={campaign.milestones} />
      <div className="campaign-action">{children}</div>
    </article>
  );
}
export function Pagination({
  page,
  total,
  limit,
  onChange,
}: {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        className="icon-button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={18} />
      </button>
      <span>
        Page {page} of {pages}
      </span>
      <button
        className="icon-button"
        aria-label="Next page"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
