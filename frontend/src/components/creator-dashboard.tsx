'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ExternalLink, RefreshCw } from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import { useResource } from '@/hooks/use-resource';
import { money, number } from '@/utils/format';
import type { Summary } from '@/types';
import { Shell } from './shell';
import { CampaignCard, Empty, ErrorNotice, Pagination, Stat } from './ui';
import { CampaignListSkeleton, LoadingContent, Skeleton, StatsSkeleton } from './skeletons';
import { SubmissionRow } from './submission-actions';

export function CreatorDashboard() {
  const session = useSession('creator');
  const [page, setPage] = useState(1);
  const earnings = useResource<Summary>(`/creator/summary?page=${page}&limit=5`, !!session.user);

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
          <h1>Dashboard</h1>
          <p>
            {session.user ? (
              `Hi ${session.user.name.split(' ')[0]}, here are your campaigns and earnings.`
            ) : (
              <Skeleton width={340} height={20} />
            )}
          </p>
        </div>
        <Link className="button primary" href="/creator/campaigns">
          Browse live campaigns
          <ArrowUpRight size={18} />
        </Link>
      </div>
      {earnings.error && <ErrorNotice error={earnings.error} retry={earnings.reload} />}
      <LoadingContent
        loading={earnings.loading}
        label="Loading your totals…"
        skeleton={<StatsSkeleton />}
      >
        {earnings.data && (
          <section className="stats" aria-label="Your totals">
            <Stat
              label="Total earnings"
              value={money(earnings.data.totalEarnings)}
              note="Credited across all your posts"
            />
            <Stat
              label="Total views"
              value={number(earnings.data.totalViews)}
              note="Across submitted posts"
            />
            <Stat
              label="Submissions"
              value={String(earnings.data.total)}
              note="Posts submitted to campaigns"
            />
          </section>
        )}
      </LoadingContent>
      <section id="campaigns" aria-label="My campaigns">
        <div className="section-heading">
          <div>
            <h2>
              My campaigns{' '}
              <span className="count">
                {earnings.loading ? (
                  <Skeleton width={16} height={14} />
                ) : (
                  (earnings.data?.total ?? '—')
                )}
              </span>
            </h2>
            <p>Your submitted posts and payouts · 5 per page</p>
          </div>
          <button className="button subtle" onClick={earnings.reload} disabled={earnings.loading}>
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
        <LoadingContent
          loading={earnings.loading}
          label="Loading your campaigns…"
          skeleton={
            <CampaignListSkeleton rows={earnings.data?.submissions.length || 2} withSubmission />
          }
        >
          {earnings.data &&
            (earnings.data.submissions.length === 0 ? (
              <Empty title="No campaigns joined yet">
                Browse live campaigns and submit a post to get started.
              </Empty>
            ) : (
              <div className="campaign-list joined-campaign-list">
                {earnings.data.submissions.map((submission) => (
                  <div className="joined-campaign" key={submission._id}>
                    {submission.campaign ? (
                      <CampaignCard
                        campaign={submission.campaign}
                        summary={
                          <SubmissionRow
                            submission={submission}
                            showIdentity={false}
                            onUpdated={earnings.reload}
                          />
                        }
                      >
                        <a
                          className="button secondary"
                          href={submission.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open post
                          <ExternalLink size={15} />
                        </a>
                      </CampaignCard>
                    ) : (
                      <SubmissionRow submission={submission} onUpdated={earnings.reload} />
                    )}
                  </div>
                ))}
              </div>
            ))}
        </LoadingContent>
        {earnings.data && (
          <Pagination
            page={page}
            total={earnings.data.total}
            limit={earnings.data.limit}
            onChange={setPage}
            loading={earnings.loading}
          />
        )}
      </section>
    </Shell>
  );
}
