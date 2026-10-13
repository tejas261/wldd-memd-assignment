'use client';

import { useState } from 'react';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import { useResource } from '@/hooks/use-resource';
import { money, number } from '@/utils/format';
import type { Campaign, CampaignData, Summary } from '@/types';
import { Shell } from './shell';
import { CampaignCard, Empty, ErrorNotice, Pagination, Stat } from './ui';
import {
  CampaignListSkeleton,
  LoadingContent,
  Skeleton,
  StatsSkeleton,
  SubmissionListSkeleton,
} from './skeletons';
import { SubmitPost, SubmissionRow } from './submission-actions';

export function CreatorDashboard() {
  const session = useSession('creator');
  const [campaignPage, setCampaignPage] = useState(1);
  const [postPage, setPostPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [notice, setNotice] = useState('');
  const campaigns = useResource<CampaignData>(
    `/campaigns?page=${campaignPage}`,
    !!session.user,
    revision,
  );
  const earnings = useResource<Summary>(
    `/creator/summary?page=${postPage}`,
    !!session.user,
    revision,
  );
  function refresh() {
    setRevision((value) => value + 1);
  }
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
      </div>
      {notice && (
        <div className="notice success" role="status">
          {notice}
        </div>
      )}
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
      <section id="campaigns">
        <div className="section-heading">
          <div>
            <h2>
              Live campaigns{' '}
              <span className="count">
                {campaigns.loading ? (
                  <Skeleton width={16} height={14} />
                ) : (
                  (campaigns.data?.total ?? '—')
                )}
              </span>
            </h2>
            <p>Choose a campaign to see its milestones and submit a post.</p>
          </div>
          <button
            className="button subtle"
            onClick={refresh}
            disabled={campaigns.loading || earnings.loading}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
        <LoadingContent
          loading={campaigns.loading}
          label="Loading live campaigns…"
          skeleton={<CampaignListSkeleton rows={campaigns.data?.campaigns.length || 2} />}
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
                    <button className="button secondary" onClick={() => setSelected(campaign)}>
                      Submit a post
                      <ArrowUpRight size={16} />
                    </button>
                  </CampaignCard>
                ))}
              </div>
            ))
          )}
        </LoadingContent>
        {campaigns.data && (
          <Pagination
            page={campaignPage}
            total={campaigns.data.total}
            limit={campaigns.data.limit}
            onChange={setCampaignPage}
            loading={campaigns.loading}
          />
        )}
      </section>
      <section id="earnings">
        <div className="section-heading">
          <div>
            <h2>My submissions</h2>
            <p>Update views to calculate your milestone payout.</p>
          </div>
        </div>
        <LoadingContent
          loading={earnings.loading}
          label="Loading your submissions…"
          skeleton={<SubmissionListSkeleton rows={earnings.data?.submissions.length || 2} />}
        >
          {earnings.data && earnings.data.submissions.length > 0 ? (
            <div className="submission-list">
              {earnings.data.submissions.map((submission) => (
                <SubmissionRow key={submission._id} submission={submission} onUpdated={refresh} />
              ))}
            </div>
          ) : (
            earnings.data && (
              <Empty title="No submissions yet">
                Submit a post to a campaign above. Your views and earnings will show up here.
              </Empty>
            )
          )}
        </LoadingContent>
        {earnings.data && (
          <Pagination
            page={postPage}
            total={earnings.data.total}
            limit={earnings.data.limit}
            onChange={setPostPage}
            loading={earnings.loading}
          />
        )}
      </section>
      {selected && (
        <SubmitPost
          campaign={selected}
          onClose={() => setSelected(null)}
          onSubmitted={() => {
            setSelected(null);
            setPostPage(1);
            setNotice('Post submitted. You can update its views under My submissions.');
            refresh();
          }}
        />
      )}
    </Shell>
  );
}
