import type { ReactNode } from 'react';

export function Skeleton({
  width = '100%',
  height = 14,
  className = '',
}: {
  width?: number | string;
  height?: number | string;
  className?: string;
}) {
  return <span className={`skeleton ${className}`} style={{ width, height }} aria-hidden="true" />;
}

export function LoadingContent({
  loading,
  label,
  skeleton,
  children,
}: {
  loading: boolean;
  label: string;
  skeleton: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <span className="sr-only" role="status">
        {loading ? label : ''}
      </span>
      <div aria-busy={loading}>
        {loading && <div aria-hidden="true">{skeleton}</div>}
        {/* Keep form state and update messages when refreshing existing rows. */}
        <div hidden={loading}>{children}</div>
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="stats">
      {[0, 1, 2].map((index) => (
        <div className="stat stat-skeleton" key={index}>
          <div className="stat-label">
            <Skeleton width="65%" height="1em" />
          </div>
          <strong>
            <Skeleton width="75%" height="1.3em" />
          </strong>
          <span>
            <Skeleton width="85%" height="1em" />
          </span>
        </div>
      ))}
    </div>
  );
}

export function CampaignTableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="table-scroll">
      <table className="campaign-table">
        <thead>
          <tr>
            {['Campaign', 'Platform', 'Budget', 'Paid', 'Remaining', 'Status', ''].map(
              (label, index) => (
                <th key={index} className={index >= 2 && index <= 4 ? 'amount' : undefined}>
                  {label}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, index) => (
            <tr key={index}>
              <td>
                <div className="skeleton-stack skeleton-campaign-name">
                  <Skeleton width="80%" height={18} />
                  <Skeleton width="55%" height={12} />
                </div>
              </td>
              <td>
                <Skeleton width={85} />
              </td>
              {[0, 1, 2].map((column) => (
                <td className="amount" key={column}>
                  <Skeleton width={65} />
                </td>
              ))}
              <td>
                <Skeleton width={48} />
              </td>
              <td>
                <Skeleton width={105} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CampaignListSkeleton({
  rows = 2,
  withSubmission = false,
}: {
  rows?: number;
  withSubmission?: boolean;
}) {
  return (
    <div className="campaign-list">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className={withSubmission ? 'joined-campaign' : undefined}>
          <div className="campaign-card">
            <div className="campaign-description">
              <div className="card-top">
                <Skeleton width={85} />
                <Skeleton width={40} height={12} />
              </div>
              <Skeleton width="75%" height={22} />
              <div className="budget-info">
                <Skeleton width="42%" height={12} />
                <Skeleton width="30%" height={12} />
              </div>
              <Skeleton height={4} />
            </div>
            {withSubmission ? (
              <SubmissionSkeleton showIdentity={false} />
            ) : (
              <div className="ladder">
                <div className="ladder-label">
                  <span>Views</span>
                  <span>Total payout</span>
                </div>
                {[0, 1, 2].map((step) => (
                  <div className="ladder-step" key={step}>
                    <Skeleton width={45} height={18} />
                    <Skeleton width={55} height={18} />
                  </div>
                ))}
              </div>
            )}
            <div className="campaign-action">
              <Skeleton className="skeleton-button" width={135} height={40} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SubmissionListSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="submission-list">
      {Array.from({ length: rows }, (_, index) => (
        <SubmissionSkeleton key={index} />
      ))}
    </div>
  );
}

function SubmissionSkeleton({ showIdentity = true }: { showIdentity?: boolean }) {
  return (
    <div className="submission-row">
      <div className={`submission-top ${showIdentity ? '' : 'submission-totals'}`}>
        {showIdentity && (
          <div className="submission-name skeleton-stack">
            <Skeleton width="70%" height={20} />
            <Skeleton width={70} height={16} />
          </div>
        )}
        {['Views', showIdentity ? 'Credited' : 'Earnings'].map((label) => (
          <div className="submission-metric" key={label}>
            <span>{label}</span>
            <strong>
              <Skeleton width={65} height="1.5em" />
            </strong>
          </div>
        ))}
      </div>
      <div className="submission-tags">
        <Skeleton width={120} height={16} />
      </div>
      <div className="simulator">
        <Skeleton width={105} height={26} />
      </div>
    </div>
  );
}
