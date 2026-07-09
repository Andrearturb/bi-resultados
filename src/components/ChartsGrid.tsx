import type { CategoryTreemapNode, RegionPoint, ExecutiveSummary as ExecutiveSummaryData } from '../types';
import { CategoryTreemapCard } from './charts/CategoryTreemapCard';
import { RegionVolumeCard } from './charts/RegionVolumeCard';
import { ExecutiveSummary } from './ExecutiveSummary';

type Props = {
  regions: RegionPoint[];
  categoryTree: CategoryTreemapNode[];
  executiveSummary: ExecutiveSummaryData;
};

export const ChartsGrid = ({ regions, categoryTree, executiveSummary }: Props) => {
  return (
    <section className="charts-grid">
      <RegionVolumeCard regions={regions} />
      <article className="chart-card chart-card--wide">
        <ExecutiveSummary summary={executiveSummary} />
      </article>
      <CategoryTreemapCard categoryTree={categoryTree} />
    </section>
  );
};
