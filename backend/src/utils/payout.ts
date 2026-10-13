export interface Milestone {
  views: number;
  payout: number;
}

export function calculatePayout(views: number, milestones: readonly Milestone[]): number {
  return milestones.reduce(
    (highest, milestone) =>
      views >= milestone.views ? Math.max(highest, milestone.payout) : highest,
    0,
  );
}

export function calculateIncrement(
  eligiblePayout: number,
  alreadyPaid: number,
  remainingBudget: number,
): number {
  return Math.min(Math.max(0, eligiblePayout - alreadyPaid), Math.max(0, remainingBudget));
}
