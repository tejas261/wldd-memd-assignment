'use client';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';

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
        <Button disabled={!session.user} onClick={() => setCreating(true)}>
          <Plus size={18} />
          Create campaign
        </Button>
      </div>
      {notice && (
        <Alert className="notice success" role="status">
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
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
          <Button variant="outline" disabled={resource.loading} onClick={resource.reload}>
            <RefreshCw size={15} />
            Refresh
          </Button>
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
              <div className="table-scroll">
                <Table
                  className="campaign-table"
                  containerProps={{ tabIndex: 0, role: 'region', 'aria-label': 'Campaign budgets' }}
                >
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Campaign</TableHead>
                      <TableHead scope="col">Platform</TableHead>
                      <TableHead scope="col" className="amount">
                        Budget
                      </TableHead>
                      <TableHead scope="col" className="amount">
                        Paid
                      </TableHead>
                      <TableHead scope="col" className="amount">
                        Remaining
                      </TableHead>
                      <TableHead scope="col">Status</TableHead>
                      <TableHead scope="col">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resource.data.campaigns.map((campaign) => (
                      <TableRow key={campaign._id}>
                        <TableCell>
                          <h3>{campaign.name}</h3>
                          <span className="muted">{campaign.milestones.length} milestones</span>
                        </TableCell>
                        <TableCell>
                          <Platform value={campaign.platform} />
                        </TableCell>
                        <TableCell className="amount">{money(campaign.budget)}</TableCell>
                        <TableCell className="amount">{money(campaign.spent)}</TableCell>
                        <TableCell className="amount">
                          {money(Math.max(0, campaign.budget - campaign.spent))}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`status ${campaign.spent < campaign.budget ? 'live' : ''}`}
                          >
                            <i />
                            {campaign.spent < campaign.budget ? 'Live' : 'Budget used'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto px-0"
                            onClick={() => setSelected(campaign)}
                          >
                            View submissions
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
