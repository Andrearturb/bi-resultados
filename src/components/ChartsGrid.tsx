import type { CategoryTreemapNode, MonthlyPoint, RegionPoint, ExecutiveSummary as ExecutiveSummaryData } from '../types';
import { CategoryTreemapCard } from './charts/CategoryTreemapCard';
import { MonthlyTrendCard } from './charts/MonthlyTrendCard';
import { OperationalRegionsCard } from './charts/OperationalRegionsCard';
import { RegionVolumeCard } from './charts/RegionVolumeCard';
import { ExecutiveSummary } from './ExecutiveSummary';

type Props = {
  regions: RegionPoint[];
  months: MonthlyPoint[];
  periodLabel: string;
  categoryTree: CategoryTreemapNode[];
  executiveSummary: ExecutiveSummaryData;
};

export const ChartsGrid = ({ regions, months, periodLabel, categoryTree, executiveSummary }: Props) => {
  return (
    <section className="charts-grid">
      <RegionVolumeCard regions={regions} />
      <OperationalRegionsCard regions={regions} periodLabel={periodLabel} />
      <article className="chart-card chart-card--wide">
        <ExecutiveSummary summary={executiveSummary} />
      </article>
      <CategoryTreemapCard categoryTree={categoryTree} />
      <MonthlyTrendCard months={months} />
    </section>
  );
};