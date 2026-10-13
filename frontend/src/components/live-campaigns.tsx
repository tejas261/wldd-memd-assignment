'use client';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import { useResource } from '@/hooks/use-resource';
import type { Campaign, CampaignData } from '@/types';
import { Shell } from './shell';
import { CampaignCard, Empty, ErrorNotice, Pagination } from './ui';
import { CampaignListSkeleton, LoadingContent, Skeleton } from './skeletons';
import { SubmitPost } from './submission-actions';

export function LiveCampaigns() {
  const session = useSession('creator');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [notice, setNotice] = useState('');
  const campaigns = useResource<CampaignData>(`/campaigns?page=${page}&limit=10`, !!session.user);

  useEffect(() => {
    if (campaigns.data?.page !== page) return;
    const lastPage = Math.max(1, Math.ceil(campaigns.data.total / campaigns.data.limit));
    if (page > lastPage) setPage(lastPage);
  }, [campaigns.data, page]);

  if (session.error)
    return (
      <main className="center-screen">
        <ErrorNotice error={session.error} retry={session.retry} />
      </main>
    );

  return (
    <Shell user={session.user} role="creator">
      <div className="page-heading">
        <div>
          <h1>Live campaigns</h1>
          <p>Browse campaigns with budget available and submit a post to join.</p>
        </div>
        <Button variant="outline" onClick={campaigns.reload} disabled={campaigns.loading}>
          <RefreshCw size={15} />
          Refresh
        </Button>
      </div>
      {notice && (
        <Alert className="notice success" role="status">
          <AlertDescription className="block">
            {notice} <Link href="/creator">View your dashboard</Link>
          </AlertDescription>
        </Alert>
      )}
      <section aria-label="Live campaigns">
        <div className="section-heading">
          <h2>
            All live campaigns{' '}
            <span className="count">
              {campaigns.loading ? (
                <Skeleton width={16} height={14} />
              ) : (
                (campaigns.data?.total ?? '—')
              )}
            </span>
          </h2>
          <span className="muted">10 per page</span>
        </div>
        <LoadingContent
          loading={campaigns.loading}
          label="Loading live campaigns…"
          skeleton={<CampaignListSkeleton rows={campaigns.data?.campaigns.length || 3} />}
        >
          {campaigns.error ? (
            <ErrorNotice error={campaigns.error} retry={campaigns.reload} />
          ) : (
            campaigns.data &&
            (campaigns.data.campaigns.length === 0 ? (
              <Empty title="No live campaigns">
                There aren’t any campaigns with budget available right now. Check back soon.
              </Empty>
            ) : (
              <div className="campaign-list">
                {campaigns.data.campaigns.map((campaign) => (
                  <CampaignCard key={campaign._id} campaign={campaign}>
                    {campaign.hasSubmitted ? (
                      <div className="joined-action">
                        <Badge variant="outline" className="status live">
                          Post submitted
                        </Badge>
                        <Button asChild variant="outline">
                          <Link href="/creator">
                            View dashboard
                            <ArrowUpRight size={16} />
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" onClick={() => setSelected(campaign)}>
                        Submit a post
                        <ArrowUpRight size={16} />
                      </Button>
                    )}
                  </CampaignCard>
                ))}
              </div>
            ))
          )}
        </LoadingContent>
        {campaigns.data && (
          <Pagination
            page={page}
            total={campaigns.data.total}
            limit={campaigns.data.limit}
            onChange={setPage}
            loading={campaigns.loading}
          />
        )}
      </section>
      {selected && (
        <SubmitPost
          campaign={selected}
          onClose={() => setSelected(null)}
          onSubmitted={() => {
            setSelected(null);
            setNotice('Post submitted. This campaign is now on your dashboard.');
            campaigns.reload();
          }}
        />
      )}
    </Shell>
  );
}
