import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { MonthlyPoint } from '../../types';

type Props = {
  months: MonthlyPoint[];
};

export const MonthlyTrendCard = ({ months }: Props) => {
  return (
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
  );
};