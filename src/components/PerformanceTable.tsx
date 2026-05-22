import type { RankedItem } from '../types';

type Props = {
  rows: RankedItem[];
  title: string;
  subtitle: string;
};

const rateTone = (value: number) => {
  if (value >= 75) return 'row-good';
  if (value >= 50) return 'row-neutral';
  return 'row-bad';
};

export const PerformanceTable = ({ rows, title, subtitle }: Props) => (
  <section className="table-card">
    <div className="chart-header">
      <div>
        <p className="eyebrow">Performance</p>
        <h3>{title}</h3>
        <p className="muted">{subtitle}</p>
      </div>
    </div>

    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Volume</th>
            <th>Concluídos</th>
            <th>Em andamento</th>
            <th>Taxa de conclusão</th>
            <th>Tempo médio</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className={rateTone(row.completionRate)}>
              <td>{row.label}</td>
              <td>{row.volume}</td>
              <td>{row.concluded}</td>
              <td>{row.inProgress}</td>
              <td>
                <div className="table-progress">
                  <span>{row.completionRate.toFixed(1)}%</span>
                  <div className="progress-track progress-track--small">
                    <div className="progress-fill" style={{ width: `${Math.min(100, row.completionRate)}%` }} />
                  </div>
                </div>
              </td>
              <td>{row.averageDaysToConclusion === null ? '-' : `${row.averageDaysToConclusion.toFixed(1)} dias`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);