'use client';

import { useState, type FormEvent } from 'react';
import { ArrowUpRight, ExternalLink, FlaskConical } from 'lucide-react';
import { api } from '@/utils/api';
import { message } from '@/utils/errors';
import { money, number } from '@/utils/format';
import { useResource } from '@/hooks/use-resource';
import type { Campaign, Submission, PageData } from '@/types';
import { Empty, ErrorNotice, Loading, Modal, Pagination, Ladder } from './ui';

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
    <Modal title="Submit a post" onClose={onClose} busy={busy}>
      <p className="modal-intro">
        Submitting to <strong>{campaign.name}</strong>
      </p>
      <form onSubmit={submit}>
        <label className="field">
          {campaign.platform === 'instagram' ? 'Instagram' : 'YouTube'} post link
          <input
            name="postUrl"
            type="url"
            placeholder={
              campaign.platform === 'instagram'
                ? 'https://www.instagram.com/reel/…'
                : 'https://www.youtube.com/watch?v=…'
            }
            required
            autoFocus
            maxLength={2048}
          />
        </label>
        <p className="field-hint">
          One post per campaign. Use a public post on the campaign’s platform.
        </p>
        <div className="notice">
          Payouts follow the highest milestone reached, subject to the campaign’s remaining budget.
        </div>
        {error && <ErrorNotice error={error} />}
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? 'Submitting…' : 'Submit post'}
            <ArrowUpRight size={17} />
          </button>
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
    <details className="simulator">
      <summary>
        <FlaskConical size={14} />
        Simulate views
      </summary>
      <form onSubmit={update}>
        <label className="field">
          Total views
          <input
            aria-label="Total views"
            type="number"
            min="0"
            step="1"
            max="1000000000000"
            value={views}
            required
            onChange={(event) => setViews(event.target.value)}
          />
        </label>
        <button className="button secondary" disabled={busy}>
          {busy ? 'Updating…' : 'Update views'}
        </button>
      </form>
      <p className="field-hint">
        Demo control. Updates the total view count; lower counts are ignored.
      </p>
      {error && <ErrorNotice error={error} />}{' '}
      {notice && (
        <p className="success-text" role="status">
          {notice}
        </p>
      )}
    </details>
  );
}

export function SubmissionRow({
  submission,
  brand = false,
  onUpdated,
}: {
  submission: Submission;
  brand?: boolean;
  onUpdated: () => void;
}) {
  const shortfall = submission.eligiblePayout - submission.payout;
  return (
    <article className="submission-row">
      <div className="submission-top">
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
        <div className="submission-metric">
          <span>Views</span>
          <strong>{number(submission.views)}</strong>
        </div>
        <div className="submission-metric">
          <span>Credited</span>
          <strong>{money(submission.payout)}</strong>
        </div>
      </div>
      <div className="submission-tags">
        {shortfall > 0 ? (
          <span className="tag warning">Budget limited · {money(shortfall)} uncredited</span>
        ) : (
          <span className="tag">
            {submission.payout > 0 ? 'Milestone reached' : 'No milestone reached'}
          </span>
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
    <Modal title={campaign.name} onClose={onClose}>
      <p className="modal-intro">Payout milestones and submitted posts.</p>
      <Ladder milestones={campaign.milestones} />
      {resource.error ? (
        <ErrorNotice error={resource.error} retry={resource.reload} />
      ) : !resource.data ? (
        <Loading />
      ) : resource.data.submissions.length === 0 ? (
        <Empty title="No submissions yet">Creators’ submissions will appear here.</Empty>
      ) : (
        <>
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
          <Pagination
            page={page}
            total={resource.data.total}
            limit={resource.data.limit}
            onChange={setPage}
          />
        </>
      )}
    </Modal>
  );
}
