'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

import { useState, type FormEvent } from 'react';
import { ArrowUpRight, ExternalLink, FlaskConical } from 'lucide-react';
import { api } from '@/utils/api';
import { message } from '@/utils/errors';
import { money, number } from '@/utils/format';
import { useResource } from '@/hooks/use-resource';
import type { Campaign, Submission, PageData } from '@/types';
import { Empty, ErrorNotice, Modal, Pagination, Ladder } from './ui';
import { LoadingContent, SubmissionListSkeleton } from './skeletons';

export function SubmitPost({
  campaign,
  onClose,
  onSubmitted,
}: {
  campaign: Campaign;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const fields = new FormData(event.currentTarget);
    try {
      await api('/submissions', {
        method: 'POST',
        body: JSON.stringify({ campaignId: campaign._id, postUrl: fields.get('postUrl') }),
      });
      onSubmitted();
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Submit a post"
      description={
        <>
          Submitting to <strong>{campaign.name}</strong>
        </>
      }
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit}>
        <Label className="field">
          {campaign.platform === 'instagram' ? 'Instagram' : 'YouTube'} post link
          <Input
            name="postUrl"
            type="url"
            placeholder={
              campaign.platform === 'instagram'
                ? 'https://www.instagram.com/reel/…'
                : 'https://www.youtube.com/watch?v=…'
            }
            required
            maxLength={2048}
          />
        </Label>
        <p className="field-hint">
          One post per campaign. Use a public post on the campaign’s platform.
        </p>
        <Alert className="notice" role="note">
          <AlertDescription>
            Payouts follow the highest milestone reached, subject to the campaign’s remaining
            budget.
          </AlertDescription>
        </Alert>
        {error && <ErrorNotice error={error} />}
        <div className="modal-actions">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Submitting…' : 'Submit post'}
            <ArrowUpRight size={17} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function ViewSimulator({
  submission,
  onUpdated,
}: {
  submission: Submission;
  onUpdated: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [views, setViews] = useState(String(submission.views));
  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await api<{ paidNow: number; submission: Submission }>(
        `/submissions/${submission._id}/views`,
        { method: 'PATCH', body: JSON.stringify({ views: Number(views) }) },
      );
      setViews(String(result.submission.views));
      setNotice(
        result.paidNow > 0
          ? `${money(result.paidNow)} credited. Your totals are up to date.`
          : 'Views checked. No additional payout on this update.',
      );
      onUpdated();
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Collapsible className="simulator">
      <CollapsibleTrigger asChild>
        <Button type="button" variant="link" size="sm" className="h-auto px-0">
          <FlaskConical size={14} />
          Simulate views
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <form onSubmit={update}>
          <Label className="field">
            Total views
            <Input
              aria-label="Total views"
              type="number"
              min="0"
              step="1"
              max="1000000000000"
              value={views}
              required
              onChange={(event) => setViews(event.target.value)}
            />
          </Label>
          <Button type="submit" variant="outline" disabled={busy}>
            {busy ? 'Updating…' : 'Update views'}
          </Button>
        </form>
        {error && <ErrorNotice error={error} />}{' '}
        {notice && (
          <p className="success-text" role="status">
            {notice}
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SubmissionRow({
  submission,
  brand = false,
  showIdentity = true,
  onUpdated,
}: {
  submission: Submission;
  brand?: boolean;
  showIdentity?: boolean;
  onUpdated: () => void;
}) {
  const shortfall = submission.eligiblePayout - submission.payout;
  return (
    <article className="submission-row">
      <div className={`submission-top ${showIdentity ? '' : 'submission-totals'}`}>
        {showIdentity && (
          <div className="submission-name">
            <h3>
              {brand
                ? (submission.creator?.name ?? 'Creator')
                : (submission.campaign?.name ?? 'Campaign unavailable')}
            </h3>
            <a href={submission.postUrl} target="_blank" rel="noopener noreferrer">
              Open post
              <ExternalLink size={12} />
            </a>
          </div>
        )}
        <div className="submission-metric">
          <span>Views</span>
          <strong>{number(submission.views)}</strong>
        </div>
        <div className="submission-metric">
          <span>{brand ? 'Credited' : 'Earnings'}</span>
          <strong>{money(submission.payout)}</strong>
        </div>
      </div>
      <div className="submission-tags">
        {shortfall > 0 ? (
          <Badge variant="outline" className="tag warning">
            Budget limited · {money(shortfall)} uncredited
          </Badge>
        ) : (
          <Badge variant="outline" className="tag">
            {submission.payout > 0 ? 'Milestone reached' : 'No milestone reached'}
          </Badge>
        )}
      </div>
      <ViewSimulator submission={submission} onUpdated={onUpdated} />
    </article>
  );
}

export function CampaignSubmissions({
  campaign,
  onClose,
  onUpdated,
}: {
  campaign: Campaign;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [page, setPage] = useState(1);
  const resource = useResource<PageData & { submissions: Submission[] }>(
    `/campaigns/${campaign._id}/submissions?page=${page}`,
  );
  return (
    <Modal
      title={campaign.name}
      description="Payout milestones and submitted posts."
      onClose={onClose}
    >
      <Ladder milestones={campaign.milestones} />
      <LoadingContent
        loading={resource.loading}
        label="Loading campaign submissions…"
        skeleton={<SubmissionListSkeleton rows={resource.data?.submissions.length || 2} />}
      >
        {resource.error ? (
          <ErrorNotice error={resource.error} retry={resource.reload} />
        ) : (
          resource.data &&
          (resource.data.submissions.length === 0 ? (
            <Empty title="No submissions yet">Creators’ submissions will appear here.</Empty>
          ) : (
            <div className="submission-list">
              {resource.data.submissions.map((submission) => (
                <SubmissionRow
                  key={submission._id}
                  submission={submission}
                  brand
                  onUpdated={() => {
                    resource.reload();
                    onUpdated();
                  }}
                />
              ))}
            </div>
          ))
        )}
      </LoadingContent>
      {resource.data && (
        <Pagination
          page={page}
          total={resource.data.total}
          limit={resource.data.limit}
          onChange={setPage}
          loading={resource.loading}
        />
      )}
    </Modal>
  );
}
