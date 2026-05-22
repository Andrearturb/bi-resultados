import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { RegionPoint } from '../../types';

type Props = {
  regions: RegionPoint[];
  periodLabel: string;
};

type OperationalPoint = RegionPoint & {
  operationalTotal: number;
  operationalRate: number;
};

const buildOperationalRegions = (regions: RegionPoint[]): OperationalPoint[] =>
  [...regions]
    .map((region) => {
      const operationalTotal = region.concluded + region.inProgress;

      return {
        ...region,
        operationalTotal,
        operationalRate: operationalTotal ? (region.concluded / operationalTotal) * 100 : 0,
      };
    })
    .sort((left, right) => right.operationalTotal - left.operationalTotal);

const OperationalTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: OperationalPoint }>;
}) => {
  if (!active || !payload?.length || !payload[0]?.payload) {
    return null;
  }

  const region = payload[0].payload;

  return (
    <div className="chart-tooltip chart-tooltip--executive">
      <div className="chart-tooltip__title">{region.region}</div>

      <div className="chart-tooltip__row">
        <span className="chart-tooltip__label">Em andamento:</span>
        <strong className="chart-tooltip__value chart-tooltip__value--inprogress">
          {region.inProgress}
        </strong>
      </div>

      <div className="chart-tooltip__row">
        <span className="chart-tooltip__label">Concluídos:</span>
        <strong className="chart-tooltip__value chart-tooltip__value--concluded">
          {region.concluded}
        </strong>
      </div>

      <div className="chart-tooltip__row">
        <span className="chart-tooltip__label">Taxa de conclusão:</span>
        <strong className="chart-tooltip__value chart-tooltip__value--rate">
          {region.operationalRate.toFixed(0)}%
        </strong>
      </div>
    </div>
  );
};

export const OperationalRegionsCard = ({ regions, periodLabel }: Props) => {
  const operationalRegions = buildOperationalRegions(regions);
  const totalConcluded = operationalRegions.reduce((sum, region) => sum + region.concluded, 0);
  const totalInProgress = operationalRegions.reduce((sum, region) => sum + region.inProgress, 0);
  const operationalTotal = totalConcluded + totalInProgress;
  const overallRate = operationalTotal ? (totalConcluded / operationalTotal) * 100 : 0;

  return (
    <article className="chart-card chart-card--wide chart-card--ops">
      <div className="chart-header">
        <div>
          <p className="eyebrow">Operação por praça</p>
          <h3>Concluídos vs. Em andamento por Praça</h3>
          <p className="muted chart-subtitle">{periodLabel}</p>
        </div>
      </div>

      <section className="ops-kpi-grid">
        <article className="ops-kpi-card">
          <span className="ops-kpi-icon ops-kpi-icon--concluded">✓</span>
          <div>
            <p>Total Concluídos</p>
            <strong>{totalConcluded.toLocaleString('pt-BR')}</strong>
          </div>
        </article>

        <article className="ops-kpi-card">
          <span className="ops-kpi-icon ops-kpi-icon--inprogress">◔</span>
          <div>
            <p>Total Em andamento</p>
            <strong>{totalInProgress.toLocaleString('pt-BR')}</strong>
          </div>
        </article>

        <article className="ops-kpi-card">
          <span className="ops-kpi-icon ops-kpi-icon--rate">↗</span>
          <div>
            <p>Taxa de conclusão geral</p>
            <strong>{overallRate.toFixed(0)}%</strong>
          </div>
        </article>
      </section>

      <ResponsiveContainer width="100%" height={420}>
        <BarChart
          data={operationalRegions}
          layout="vertical"
          barCategoryGap="22%"
          barGap={6}
          margin={{ top: 6, right: 24, bottom: 12, left: 22 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(5,56,98,0.09)"
            horizontal={false}
          />

          <XAxis
            type="number"
            tickLine={false}
            axisLine={{ stroke: 'rgba(5,56,98,0.2)' }}
            tick={{
              fill: '#0f172a',
              fontSize: 11,
              fontWeight: 500,
            }}
          />

          <YAxis
            type="category"
            dataKey="region"
            tickLine={false}
            axisLine={{ stroke: 'rgba(5,56,98,0.2)' }}
            tick={{
              fill: '#0f172a',
              fontSize: 12,
              fontWeight: 500,
            }}
            width={150}
          />

          <Tooltip content={<OperationalTooltip />} />

          <Legend wrapperStyle={{ paddingTop: 8 }} />

          <Bar
            dataKey="inProgress"
            name="Em andamento"
            fill="#082B5B"
            radius={[0, 8, 8, 0]}
            barSize={14}
          />

          <Bar
            dataKey="concluded"
            name="Concluídos"
            fill="#0C7A75"
            radius={[0, 8, 8, 0]}
            barSize={14}
          />
        </BarChart>
      </ResponsiveContainer>
    </article>
  );
};