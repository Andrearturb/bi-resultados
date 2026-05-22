type Props = {
  label: string;
  value: string;
  helper: string;
  progress: number;
  tone?: 'teal' | 'cyan' | 'amber' | 'rose';
};

const tones = {
  teal: 'linear-gradient(135deg, rgba(12,116,112,0.18), rgba(12,116,112,0.02))',
  cyan: 'linear-gradient(135deg, rgba(7,56,98,0.18), rgba(7,56,98,0.02))',
  amber: 'linear-gradient(135deg, rgba(181,126,28,0.18), rgba(181,126,28,0.02))',
  rose: 'linear-gradient(135deg, rgba(171,55,73,0.18), rgba(171,55,73,0.02))',
} as const;

export const KpiCard = ({ label, value, helper, progress, tone = 'teal' }: Props) => (
  <article className="kpi-card" style={{ background: tones[tone] }}>
    <span className="kpi-label">{label}</span>
    <strong className="kpi-value">{value}</strong>
    <span className="kpi-helper">{helper}</span>
    <div className="progress-track" aria-hidden="true">
      <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
    </div>
  </article>
);