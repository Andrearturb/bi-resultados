import type { CategoryTreemapNode, MonthlyPoint, RegionPoint } from '../types';
import { CategoryTreemapCard } from './charts/CategoryTreemapCard';
import { MonthlyTrendCard } from './charts/MonthlyTrendCard';
import { OperationalRegionsCard } from './charts/OperationalRegionsCard';
import { RegionVolumeCard } from './charts/RegionVolumeCard';

type Props = {
  regions: RegionPoint[];
  months: MonthlyPoint[];
  periodLabel: string;
  categoryTree: CategoryTreemapNode[];
};

export const ChartsGrid = ({ regions, months, periodLabel, categoryTree }: Props) => {
  return (
    <section className="charts-grid">
      <RegionVolumeCard regions={regions} />
      <OperationalRegionsCard regions={regions} periodLabel={periodLabel} />
      <CategoryTreemapCard categoryTree={categoryTree} />
      <MonthlyTrendCard months={months} />
    </section>
  );
};