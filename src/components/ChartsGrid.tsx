import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CategoryPoint, MonthlyPoint, RegionPoint } from '../types';

type Props = {
  regions: RegionPoint[];
  months: MonthlyPoint[];
  categories: CategoryPoint[];
};

const palette = ['#0c7470', '#053862', '#2ea8a1', '#78c2b9', '#b57e1c', '#ab3749'];

const LOW_VOLUME_THRESHOLD = 10;
const MAX_REGION_BARS = 6;

const prepareRegionData = (regions: RegionPoint[]) => {
  const sorted = [...regions].sort((left, right) => right.volume - left.volume);
  const majorRegions = sorted.filter((region) => region.volume >= LOW_VOLUME_THRESHOLD).slice(0, MAX_REGION_BARS - 1);
  const groupedRegions = sorted.filter((region) => !majorRegions.includes(region));

  if (!groupedRegions.length) {
    return majorRegions;
  }

  const others = groupedRegions.reduce(
    (accumulator, region) => ({
      region: 'Outros',
      volume: accumulator.volume + region.volume,
      concluded: accumulator.concluded + region.concluded,
      completionRate: 0,
    }),
    { region: 'Outros', volume: 0, concluded: 0, completionRate: 0 }
  );

  const withOthers = [...majorRegions, others].map((region) => ({
    ...region,
    completionRate: region.volume ? (region.concluded / region.volume) * 100 : 0,
  }));

  return withOthers.sort((left, right) => right.volume - left.volume);
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
        <span>Volume</span>
        <strong>{volume}</strong>
      </div>
      <div className="chart-tooltip__row">
        <span>Concluídos</span>
        <strong>{concluded}</strong>
      </div>
      <div className="chart-tooltip__row">
        <span>Taxa de Conclusão</span>
        <strong>{rate.toFixed(0)}%</strong>
      </div>
    </div>
  );
};

export const ChartsGrid = ({ regions, months, categories }: Props) => (
  <section className="charts-grid">
    <article className="chart-card chart-card--wide">
      <div className="chart-header">
        <div>
          <p className="eyebrow">Região</p>
          <h3>Volume e conclusão por praça</h3>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={prepareRegionData(regions)} barCategoryGap="24%" barGap={8} margin={{ top: 10, right: 18, bottom: 18, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(5,56,98,0.08)" vertical={false} />
          <XAxis
            dataKey="region"
            interval={0}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            height={54}
            tick={{ fill: '#0f172a', fontSize: 12 }}
          />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: '#0f172a', fontSize: 12 }} width={40} />
          <Tooltip content={<RegionTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 8 }} />
          <Bar dataKey="volume" name="Volume" fill="#053862" radius={[8, 8, 0, 0]} />
          <Bar dataKey="concluded" name="Concluídos" fill="#0c7470" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </article>

    <article className="chart-card">
      <div className="chart-header">
        <div>
          <p className="eyebrow">Mensal</p>
          <h3>Concluídos vs. em andamento</h3>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={months}>
          <defs>
            <linearGradient id="monthlyConcluded" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0c7470" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#0c7470" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="monthlyProgress" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#053862" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#053862" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(5,56,98,0.12)" />
          <XAxis dataKey="month" tick={{ fill: '#0f172a', fontSize: 12 }} />
          <YAxis tick={{ fill: '#0f172a', fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="concluded" stroke="#0c7470" fill="url(#monthlyConcluded)" />
          <Area type="monotone" dataKey="inProgress" stroke="#053862" fill="url(#monthlyProgress)" />
        </AreaChart>
      </ResponsiveContainer>
    </article>

    <article className="chart-card">
      <div className="chart-header">
        <div>
          <p className="eyebrow">Categorias</p>
          <h3>Top serviços com mais chamados</h3>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie data={categories} dataKey="volume" nameKey="label" outerRadius={115} innerRadius={60} paddingAngle={3}>
            {categories.map((entry, index) => (
              <Cell key={entry.label} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
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