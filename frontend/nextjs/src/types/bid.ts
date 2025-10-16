export interface Bid {
  mid: number;
  nid: number;
  title: string;
  status: string;
  started_at: string;
  ended_at: string;
  memo: string;
  orgName: string;
  postedAt: string;
  detail: string;
  detailUrl: string;
  category?: string;
  region?: string;
}