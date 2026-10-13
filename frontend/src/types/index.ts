export type Role = 'brand' | 'creator';
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}
export interface Milestone {
  views: number;
  payout: number;
}
export interface Campaign {
  _id: string;
  name: string;
  platform: 'instagram' | 'youtube';
  budget: number;
  spent: number;
  milestones: Milestone[];
  createdAt: string;
  hasSubmitted?: boolean;
}
export interface Submission {
  _id: string;
  campaign: Campaign;
  creator: { _id: string; name: string };
  postUrl: string;
  views: number;
  payout: number;
  eligiblePayout: number;
}
export interface PageData {
  total: number;
  page: number;
  limit: number;
}
export interface CampaignData extends PageData {
  campaigns: Campaign[];
  summary?: { budget: number; spent: number; count: number };
}
export interface Summary extends PageData {
  submissions: Submission[];
  totalEarnings: number;
  totalViews: number;
}
