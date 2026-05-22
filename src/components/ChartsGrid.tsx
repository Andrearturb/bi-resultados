import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Treemap,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CategoryTreemapNode, MonthlyPoint, RegionPoint } from '../types';

type Props = {
  regions: RegionPoint[];
  months: MonthlyPoint[];
  periodLabel: string;
  categoryTree: CategoryTreemapNode[];
};

const RegionTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload?: RegionPoint }> }) => {
  if (!active || !payload?.length || !payload[0]?.payload) {
    return null;
  }

  const region = payload[0].payload;
  const volume = region.volume;
  const concluded = region.concluded;
  const rate = region.completionRate;

  return (
    <div className="chart-tooltip chart-tooltip--executive">
      <div className="chart-tooltip__title">{region.region}</div>
      <div className="chart-tooltip__row">
        <span className="chart-tooltip__label">Volume:</span>
        <strong className="chart-tooltip__value chart-tooltip__value--volume">{volume}</strong>
      </div>
      <div className="chart-tooltip__row">
        <span className="chart-tooltip__label">Concluídos:</span>
        <strong className="chart-tooltip__value chart-tooltip__value--concluded">{concluded}</strong>
      </div>
      <div className="chart-tooltip__row">
        <span className="chart-tooltip__label">Taxa de conclusão:</span>
        <strong className="chart-tooltip__value chart-tooltip__value--rate">{rate.toFixed(0)}%</strong>
      </div>
    </div>
  );
};

const sortRegionsByVolume = (regions: RegionPoint[]) => [...regions].sort((left, right) => right.volume - left.volume);

type TreemapNode = CategoryTreemapNode & { depth?: number; x?: number; y?: number; width?: number; height?: number };

const TreemapTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload?: TreemapNode }> }) => {
  if (!active || !payload?.length || !payload[0]?.payload) {
    return null;
  }

  const node = payload[0].payload;

  return (
    <div className="chart-tooltip chart-tooltip--executive">
      <div className="chart-tooltip__title">{node.subcategory ?? node.category}</div>
      {node.subcategory ? (
        <div className="chart-tooltip__row">
          <span className="chart-tooltip__label">Categoria:</span>
          <strong className="chart-tooltip__value chart-tooltip__value--volume">{node.category}</strong>
        </div>
      ) : null}
      {node.subcategory ? (
        <div className="chart-tooltip__row">
          <span className="chart-tooltip__label">Chamados:</span>
          <strong className="chart-tooltip__value chart-tooltip__value--concluded">{node.total}</strong>
        </div>
      ) : null}
      {node.subcategory ? (
        <div className="chart-tooltip__row">
          <span className="chart-tooltip__label">% da categoria:</span>
          <strong className="chart-tooltip__value chart-tooltip__value--rate">{node.shareOfCategory.toFixed(1)}%</strong>
        </div>
      ) : null}
      <div className="chart-tooltip__row">
        <span className="chart-tooltip__label">% do total:</span>
        <strong className="chart-tooltip__value chart-tooltip__value--rate">{node.shareOfTotal.toFixed(1)}%</strong>
      </div>
    </div>
  );
};

const TreemapCell = (props: Partial<TreemapNode>) => {
  const { x = 0, y = 0, width = 0, height = 0, depth = 1, name = '', value = 0, total = 0, shareOfTotal = 0, fill = '#ffffff', stroke = '#e5e7eb', subcategory } = props;

  if (width < 28 || height < 24) {
    return null;
  }

  const isCategory = depth === 1;
  const isLeaf = depth >= 2 || Boolean(subcategory);
  const textColor = isCategory ? '#082B5B' : '#0f172a';

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={isCategory ? 12 : 10} ry={isCategory ? 12 : 10} fill={fill} stroke={stroke} strokeWidth={1} />
      <text x={x + 12} y={y + 20} fill={textColor} fontSize={isCategory ? 13 : 12} fontWeight={700}>
        <tspan x={x + 12} dy="0">
          {name}
        </tspan>
        {isLeaf ? (
          <>
            <tspan x={x + 12} dy="18" fontWeight={800} fontSize={16}>
              {value}
            </tspan>
            <tspan x={x + 12} dy="16" fontSize={11} fontWeight={500}>
              {shareOfTotal.toFixed(1)}% do total
            </tspan>
          </>
        ) : (
          <>
            <tspan x={x + 12} dy="18" fontWeight={600} fontSize={11}>
              {total} chamados
            </tspan>
            <tspan x={x + 12} dy="16" fontSize={11} fontWeight={500}>
              {shareOfTotal.toFixed(1)}% do total
            </tspan>
          </>
        )}
      </text>
    </g>
  );
};

type OperationalPoint = RegionPoint & { operationalTotal: number; operationalRate: number };

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

const OperationalTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload?: OperationalPoint }> }) => {
  if (!active || !payload?.length || !payload[0]?.payload) {
    return null;
  }

  const region = payload[0].payload;

  return (
    <div className="chart-tooltip chart-tooltip--executive">
      <div className="chart-tooltip__title">{region.region}</div>
      <div className="chart-tooltip__row">
        <span className="chart-tooltip__label">Em andamento:</span>
        <strong className="chart-tooltip__value chart-tooltip__value--inprogress">{region.inProgress}</strong>
      </div>
      <div className="chart-tooltip__row">
        <span className="chart-tooltip__label">Concluídos:</span>
        <strong className="chart-tooltip__value chart-tooltip__value--concluded">{region.concluded}</strong>
      </div>
      <div className="chart-tooltip__row">
        <span className="chart-tooltip__label">Taxa de conclusão:</span>
        <strong className="chart-tooltip__value chart-tooltip__value--rate">{region.operationalRate.toFixed(0)}%</strong>
      </div>
    </div>
  );
};

export const ChartsGrid = ({ regions, months, periodLabel, categoryTree }: Props) => {
  const operationalRegions = buildOperationalRegions(regions);
  const totalConcluded = operationalRegions.reduce((sum, region) => sum + region.concluded, 0);
  const totalInProgress = operationalRegions.reduce((sum, region) => sum + region.inProgress, 0);
  const operationalTotal = totalConcluded + totalInProgress;
  const overallRate = operationalTotal ? (totalConcluded / operationalTotal) * 100 : 0;

  return (
    <section className="charts-grid">
    <article className="chart-card chart-card--wide">
      <div className="chart-header">
        <div>
          <p className="eyebrow">Região</p>
          <h3>Volume e conclusão por praça</h3>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={sortRegionsByVolume(regions)} barCategoryGap="26%" barGap={10} margin={{ top: 10, right: 18, bottom: 34, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(5,56,98,0.08)" vertical={false} />
          <XAxis
            dataKey="region"
            interval={0}
            tickLine={false}
            axisLine={{ stroke: 'rgba(5,56,98,0.22)', strokeWidth: 1.2 }}
            tickMargin={12}
            height={68}
            angle={-18}
            textAnchor="end"
            tick={{ fill: '#0f172a', fontSize: 11, fontWeight: 500 }}
          />
          <YAxis
            tickLine={false}
            axisLine={{ stroke: 'rgba(5,56,98,0.22)', strokeWidth: 1.2 }}
            tick={{ fill: '#0f172a', fontSize: 12, fontWeight: 500 }}
            width={44}
          />
          <Tooltip content={<RegionTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 8 }} />
          <Bar dataKey="volume" name="Volume" fill="#082B5B" radius={[8, 8, 0, 0]} />
          <Bar dataKey="concluded" name="Concluídos" fill="#0C7A75" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </article>

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
        <BarChart data={operationalRegions} layout="vertical" barCategoryGap="22%" barGap={6} margin={{ top: 6, right: 24, bottom: 12, left: 22 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(5,56,98,0.09)" horizontal={false} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={{ stroke: 'rgba(5,56,98,0.2)' }}
            tick={{ fill: '#0f172a', fontSize: 11, fontWeight: 500 }}
          />
          <YAxis
            type="category"
            dataKey="region"
            tickLine={false}
            axisLine={{ stroke: 'rgba(5,56,98,0.2)' }}
            tick={{ fill: '#0f172a', fontSize: 12, fontWeight: 500 }}
            width={150}
          />
          <Tooltip content={<OperationalTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 8 }} />
          <Bar dataKey="inProgress" name="Em andamento" fill="#082B5B" radius={[0, 8, 8, 0]} barSize={14} />
          <Bar dataKey="concluded" name="Concluídos" fill="#0C7A75" radius={[0, 8, 8, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </article>

    <article className="chart-card chart-card--wide chart-card--treemap">
      <div className="chart-header">
        <div>
          <p className="eyebrow">Categorias</p>
          <h3>Categorias e Subcategorias com mais chamados</h3>
          <p className="muted chart-subtitle">Hierarquia executiva por categoria e subcategoria</p>
        </div>
      </div>
      <section className="treemap-shell">
        <ResponsiveContainer width="100%" height={420}>
          <Treemap data={categoryTree} dataKey="value" aspectRatio={4 / 3} content={<TreemapCell />} stroke="#ffffff" fill="#ffffff" />
        </ResponsiveContainer>
      </section>
      <Tooltip content={<TreemapTooltip />} />
      <div className="treemap-legendless-note">Cada bloco representa a concentração relativa de chamados. Passe o mouse para ver a hierarquia e os percentuais.</div>
    </article>

    <article className="chart-card chart-card--wide">
      <div className="chart-header">
        <div>
          <p className="eyebrow">Tendência</p>
          <h3>Evolução mensal em linhas</h3>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={months}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(5,56,98,0.12)" />
          <XAxis dataKey="month" tick={{ fill: '#0f172a', fontSize: 12 }} />
          <YAxis tick={{ fill: '#0f172a', fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="concluded" stroke="#0c7470" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="inProgress" stroke="#053862" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </article>
    </section>
  );
};