'use client';

import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useResource } from '@/hooks/use-resource';
import { useSession } from '@/hooks/use-session';
import { money } from '@/utils/format';
import type { Campaign, CampaignData } from '@/types';
import { Shell } from './shell';
import { Empty, ErrorNotice, Pagination, Platform, Stat } from './ui';
import { CampaignTableSkeleton, LoadingContent, Skeleton, StatsSkeleton } from './skeletons';
import { CampaignForm } from './campaign-form';
import { CampaignSubmissions } from './submission-actions';

export function BrandDashboard() {
  const session = useSession('brand');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [notice, setNotice] = useState('');
  const resource = useResource<CampaignData>(`/campaigns?page=${page}`, !!session.user);
  if (session.error)
    return (
      <main className="center-screen">
        <ErrorNotice error={session.error} retry={session.retry} />
      </main>
    );
  const summary = resource.data?.summary;
  return (
    <Shell user={session.user} role="brand">
      <div className="page-heading">
        <div>
          <h1>Campaign overview</h1>
          <p>Manage campaign budgets and review creator submissions.</p>
        </div>
        <button
          className="button primary"
          disabled={!session.user}
          onClick={() => setCreating(true)}
        >
          <Plus size={18} />
          Create campaign
        </button>
      </div>
      {notice && (
        <div className="notice success" role="status">
          {notice}
        </div>
      )}
      {resource.error && <ErrorNotice error={resource.error} retry={resource.reload} />}
      <LoadingContent
        loading={resource.loading}
        label="Loading campaign totals…"
        skeleton={<StatsSkeleton />}
      >
        {resource.data && (
          <section className="stats" aria-label="Campaign totals">
            <Stat
              label="Campaign budget"
              value={money(summary?.budget ?? 0)}
              note={`Across ${resource.data.total} campaign${resource.data.total === 1 ? '' : 's'}`}
            />
            <Stat
              label="Creator payouts"
              value={money(summary?.spent ?? 0)}
              note="Credited at reached milestones"
            />
            <Stat
              label="Remaining budget"
              value={money((summary?.budget ?? 0) - (summary?.spent ?? 0))}
              note="Remaining across your campaigns"
            />
          </section>
        )}
      </LoadingContent>
      <section id="campaigns">
        <div className="section-heading">
          <div>
            <h2>
              Campaigns{' '}
              <span className="count">
                {resource.loading ? (
                  <Skeleton width={16} height={14} />
                ) : (
                  (resource.data?.total ?? '—')
                )}
              </span>
            </h2>
          </div>
          <button className="button subtle" disabled={resource.loading} onClick={resource.reload}>
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
        <LoadingContent
          loading={resource.loading}
          label="Loading campaigns…"
          skeleton={<CampaignTableSkeleton rows={resource.data?.campaigns.length || 3} />}
        >
          {resource.data &&
            (resource.data.campaigns.length === 0 ? (
              <Empty title="No campaigns yet">
                Create a campaign to start accepting posts from creators.
              </Empty>
            ) : (
              <div
                className="table-scroll"
                tabIndex={0}
                role="region"
                aria-label="Campaign budgets"
              >
                <table className="campaign-table">
                  <thead>
                    <tr>
                      <th scope="col">Campaign</th>
                      <th scope="col">Platform</th>
                      <th scope="col" className="amount">
                        Budget
                      </th>
                      <th scope="col" className="amount">
                        Paid
                      </th>
                      <th scope="col" className="amount">
                        Remaining
                      </th>
                      <th scope="col">Status</th>
                      <th scope="col">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {resource.data.campaigns.map((campaign) => (
                      <tr key={campaign._id}>
                        <td>
                          <h3>{campaign.name}</h3>
                          <span className="muted">{campaign.milestones.length} milestones</span>
                        </td>
                        <td>
                          <Platform value={campaign.platform} />
                        </td>
                        <td className="amount">{money(campaign.budget)}</td>
                        <td className="amount">{money(campaign.spent)}</td>
                        <td className="amount">
                          {money(Math.max(0, campaign.budget - campaign.spent))}
                        </td>
                        <td>
                          <span
                            className={`status ${campaign.spent < campaign.budget ? 'live' : ''}`}
                          >
                            <i />
                            {campaign.spent < campaign.budget ? 'Live' : 'Budget used'}
                          </span>
                        </td>
                        <td>
                          <button className="text-button" onClick={() => setSelected(campaign)}>
                            View submissions
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
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
      </section>
      {creating && (
        <CampaignForm
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            setPage(1);
            setNotice('Campaign created.');
            resource.reload();
          }}
        />
      )}
      {selected && (
        <CampaignSubmissions
          campaign={selected}
          onClose={() => setSelected(null)}
          onUpdated={resource.reload}
        />
      )}
    </Shell>
  );
}
