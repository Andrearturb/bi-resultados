export type CanonicalStatus = 'concluded' | 'in_progress' | 'backlog' | 'rejected' | 'other';

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
  createdOn: string | null;
  inAttendanceDate: string | null;
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
  backlog: number;
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

export type SupplierProductivity = {
  name: string;
  concluded: number;
  avgDays: number | null;
  classification: 'high' | 'volume' | 'fast' | 'slow';
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
  inProgress: number;
  completionRate: number;
};

export type CategoryPoint = {
  label: string;
  volume: number;
};

export type CategoryTreemapNode = {
  name: string;
  category: string;
  subcategory?: string;
  value: number;
  total: number;
  shareOfCategory: number;
  shareOfTotal: number;
  fill: string;
  stroke: string;
  children?: CategoryTreemapNode[];
};

export type ExecutiveInsightTone = 'teal' | 'cyan' | 'amber' | 'violet' | 'rose';

export type ExecutiveInsight = {
  icon: string;
  title: string;
  description: string;
  tone: ExecutiveInsightTone;
};

export type ExecutiveSummary = {
  total: number;
  categoryCount: number;
  subcategoryCount: number;
  concentration: number;
  topCategory: {
    label: string;
    volume: number;
    shareOfTotal: number;
  } | null;
  topSubcategory: {
    label: string;
    category: string;
    volume: number;
    shareOfCategory: number;
    shareOfTotal: number;
  } | null;
  top3CategoriesShare: number;
  trend: {
    label: string;
    delta: number;
    current: number;
    previous: number;
  } | null;
  insights: ExecutiveInsight[];
};