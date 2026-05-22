export type CanonicalStatus = 'concluded' | 'in_progress' | 'rejected' | 'other';

export type SpreadsheetRecord = {
  ticketId: string;
  status: string;
  statusGroup: CanonicalStatus;
  recurring: string;
  region: string;
  location: string;
  category: string;
  subcategory: string;
  provider: string;
  analyst: string;
  requester: string;
  requestDate: string | null;
  conclusionDate: string | null;
  visitDate: string | null;
  slaProgress: string;
  rawStatus?: string;
};

export type DashboardFilters = {
  query: string;
  region: string;
  status: string;
  category: string;
  provider: string;
  analyst: string;
  startDate: string;
  endDate: string;
};

export type DashboardMetrics = {
  total: number;
  concluded: number;
  inProgress: number;
  rejected: number;
  completionRate: number;
  avgSlaDays: number;
};

export type RankedItem = {
  label: string;
  volume: number;
  concluded: number;
  inProgress: number;
  completionRate: number;
  averageDaysToConclusion: number | null;
};

export type MonthlyPoint = {
  monthKey: string;
  month: string;
  concluded: number;
  inProgress: number;
};

export type RegionPoint = {
  region: string;
  volume: number;
  concluded: number;
  completionRate: number;
};

export type CategoryPoint = {
  label: string;
  volume: number;
};