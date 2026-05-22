type Props = {
  headline: string;
  secondary: string;
  action: string;
};

export const InsightCallout = ({ headline, secondary, action }: Props) => (
  <aside className="insight-card">
    <p className="eyebrow">Insight principal</p>
    <h3>{headline}</h3>
    <p>{secondary}</p>
    <p className="insight-action">{action}</p>
  </aside>
);