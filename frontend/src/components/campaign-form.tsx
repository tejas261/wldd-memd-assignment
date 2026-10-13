'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { api } from '@/utils/api';
import { message } from '@/utils/errors';
import { ErrorNotice, Modal } from './ui';

export function CampaignForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [milestones, setMilestones] = useState([
    { views: '10000', payout: '500' },
    { views: '50000', payout: '2000' },
    { views: '100000', payout: '5000' },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lastRequest = useRef<{ body: string; key: string } | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const fields = new FormData(event.currentTarget);
    const body = JSON.stringify({
      name: fields.get('name'),
      platform: fields.get('platform'),
      budget: Number(fields.get('budget')),
      milestones: milestones.map((m) => ({ views: Number(m.views), payout: Number(m.payout) })),
    });
    if (lastRequest.current?.body !== body)
      lastRequest.current = { body, key: crypto.randomUUID() };
    try {
      await api('/campaigns', {
        method: 'POST',
        body,
        headers: { 'Idempotency-Key': lastRequest.current!.key },
      });
      onCreated();
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  function updateMilestone(index: number, key: 'views' | 'payout', value: string) {
    setMilestones((items) =>
      items.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  }
  return (
    <Modal title="Create campaign" onClose={onClose} busy={busy}>
      <p className="modal-intro">Campaigns are live as soon as they’re created.</p>
      <form onSubmit={submit}>
        <label className="field">
          Campaign name
          <input
            name="name"
            placeholder="e.g. Weekend campaign"
            minLength={3}
            maxLength={100}
            required
            autoFocus
          />
        </label>
        <div className="form-row">
          <label className="field">
            Platform
            <select name="platform">
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
            </select>
          </label>
          <label className="field">
            Total budget (₹)
            <input
              name="budget"
              type="number"
              min="1"
              step="1"
              max="1000000000"
              defaultValue="25000"
              required
            />
          </label>
        </div>
        <div className="form-section-heading">
          <h3>Payout milestones</h3>
          <span>Up to 10 steps</span>
        </div>
        <p className="field-hint">
          Each payout is the total earned at that milestone. Amounts are in whole rupees.
        </p>
        <div className="milestone-labels">
          <span>Views needed</span>
          <span>Total payout (₹)</span>
          <span />
        </div>
        {milestones.map((milestone, index) => (
          <div className="milestone-row" key={index}>
            <input
              aria-label={`Milestone ${index + 1} views`}
              type="number"
              min="1"
              step="1"
              max="1000000000000"
              value={milestone.views}
              required
              onChange={(event) => updateMilestone(index, 'views', event.target.value)}
            />
            <input
              aria-label={`Milestone ${index + 1} payout`}
              type="number"
              min="1"
              step="1"
              max="1000000000"
              value={milestone.payout}
              required
              onChange={(event) => updateMilestone(index, 'payout', event.target.value)}
            />
            <button
              className="icon-button"
              type="button"
              aria-label={`Remove milestone ${index + 1}`}
              disabled={milestones.length === 1}
              onClick={() => setMilestones((items) => items.filter((_, i) => i !== index))}
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
        <button
          className="text-button add-milestone"
          type="button"
          disabled={milestones.length >= 10}
          onClick={() => setMilestones((items) => [...items, { views: '', payout: '' }])}
        >
          <Plus size={16} />
          Add milestone
        </button>
        {error && <ErrorNotice error={error} />}
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? 'Creating…' : 'Launch campaign'}
            <ArrowRight size={17} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
