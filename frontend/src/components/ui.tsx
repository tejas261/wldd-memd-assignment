'use client';

import { Button } from '@/components/ui/button';

import { useRef, useState } from 'react';
import {
  ArrowDownLeft,
  Camera,
  Play,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Info,
} from 'lucide-react';
import { money, shortNumber } from '@/utils/format';
import type { Campaign, Milestone } from '@/types';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Progress } from './ui/progress';
import { Pagination as PaginationRoot, PaginationContent, PaginationItem } from './ui/pagination';

export function Logo() {
  return (
    <div className="branding">
      <span className="logo">
        <span className="logo-mark">m</span> Meme’d
      </span>
      <p className="auth-footnote">Campaign payout tracker</p>
    </div>
  );
}
export function ErrorNotice({ error, retry }: { error: string; retry?: () => void }) {
  return (
    <Alert variant="destructive" className="notice error">
      <CircleAlert size={18} />
      <AlertDescription>
        {error}
        {retry && (
          <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={retry}>
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
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
  description,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const trigger = useRef<HTMLElement | null>(null);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        className="modal max-h-[90dvh] overflow-y-auto bg-card p-4 sm:max-w-[580px] sm:p-6"
        closeDisabled={busy}
        aria-busy={busy}
        onOpenAutoFocus={() => {
          if (document.activeElement instanceof HTMLElement)
            trigger.current = document.activeElement;
        }}
        onCloseAutoFocus={(event) => {
          if (trigger.current?.isConnected) {
            event.preventDefault();
            trigger.current.focus();
          }
        }}
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <DialogHeader className="pr-9 text-left">
          <DialogTitle className="[overflow-wrap:anywhere]">{title}</DialogTitle>
          <DialogDescription className="[overflow-wrap:anywhere]">{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card className="stat gap-0">
      <div className="stat-label">{label}</div>
      <strong>{value}</strong>
      <span>{note}</span>
    </Card>
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
  summary,
  children,
}: {
  campaign: Campaign;
  summary?: React.ReactNode;
  children: React.ReactNode;
}) {
  const remaining = Math.max(0, campaign.budget - campaign.spent);
  return (
    <article className="campaign-card">
      <div className="campaign-description">
        <div className="card-top">
          <Platform value={campaign.platform} />
          <Badge variant="outline" className={`status ${remaining > 0 ? 'live' : ''}`}>
            <i />
            {remaining > 0 ? 'Live' : 'Budget used'}
          </Badge>
        </div>
        <div className="campaign-heading">
          <h3>{campaign.name}</h3>
          {summary && <PayoutInfo campaign={campaign} />}
        </div>
        <div className="budget-info">
          <span>{money(remaining)} left</span>
          <span className="muted">of {money(campaign.budget)}</span>
        </div>
        <Progress
          className="budget-bar"
          value={campaign.budget > 0 ? Math.min(100, (campaign.spent / campaign.budget) * 100) : 0}
          getValueLabel={() => `${money(campaign.spent)} of ${money(campaign.budget)} spent`}
          aria-label={`${campaign.name} budget spent`}
        />
      </div>
      {summary ?? <Ladder milestones={campaign.milestones} />}
      <div className="campaign-action">{children}</div>
    </article>
  );
}

function PayoutInfo({ campaign }: { campaign: Campaign }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="payout-info"
        aria-label={`Payout milestones for ${campaign.name}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Payout milestones"
        onClick={() => setOpen(true)}
      >
        <Info size={17} />
      </Button>
      {open && (
        <Modal title="Payout milestones" description={campaign.name} onClose={() => setOpen(false)}>
          <Ladder milestones={campaign.milestones} />
          <p className="field-hint">
            Payouts follow the highest milestone reached, subject to the campaign’s remaining
            budget. Earnings shown on your dashboard are the amount already credited.
          </p>
        </Modal>
      )}
    </>
  );
}
export function Pagination({
  page,
  total,
  limit,
  onChange,
  loading = false,
}: {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
  loading?: boolean;
}) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <PaginationRoot className="pagination" aria-label="Pagination">
      <PaginationContent className="gap-3">
        <PaginationItem>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous page"
            disabled={loading || page <= 1}
            onClick={() => onChange(page - 1)}
          >
            <ChevronLeft size={18} />
          </Button>
        </PaginationItem>
        <PaginationItem aria-live="polite">
          Page {page} of {pages}
        </PaginationItem>
        <PaginationItem>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next page"
            disabled={loading || page >= pages}
            onClick={() => onChange(page + 1)}
          >
            <ChevronRight size={18} />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  );
}
