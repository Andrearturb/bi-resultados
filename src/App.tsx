import { useMemo, useState } from 'react';
import { ChartsGrid } from './components/ChartsGrid';
import { FilterBar } from './components/FilterBar';
import { KpiCard } from './components/KpiCard';
import { PerformanceTable } from './components/PerformanceTable';
import { UploadPanel } from './components/UploadPanel';
import { branding } from './config/branding';
import { formatDateInput } from './utils/date';
import {
  applyFilters,
  buildAnalystRanking,
  buildCategoryTreemap,
  buildExecutiveSummary,
  buildMetrics,
  buildProviderRanking,
  buildRegionSeries,
  defaultFilters,
  parseSpreadsheet,
} from './utils/spreadsheet';
import type { DashboardFilters, SpreadsheetRecord } from './types';

export const App = () => {
  const [records, setRecords] = useState<SpreadsheetRecord[]>([]);
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [globalStartDate, setGlobalStartDate] = useState('2026-01-01');

  // Filtered records: all normal filters applied
  const filteredRecords = useMemo(() => applyFilters(records, filters), [filters, records]);

  // Global records: context filters (no dates) + globalStartDate only
  const globalRecords = useMemo(() => {
    // Apply the same non-date filters as the main filter bar
    const contextFiltered = applyFilters(records, {
      ...filters,
      startDate: '',
      endDate: '',
    });

    if (!globalStartDate) return contextFiltered;
    const start = new Date(`${globalStartDate}T00:00:00`);
    return contextFiltered.filter((r) => {
      const dateStr = r.createdOn ?? r.requestDate;
      if (!dateStr) return true;
      const d = new Date(dateStr);
      return !Number.isNaN(d.getTime()) && d >= start;
    });
  }, [records, filters, globalStartDate]);

  const metrics = useMemo(() => buildMetrics(filteredRecords), [filteredRecords]);
  const globalMetrics = useMemo(() => buildMetrics(globalRecords), [globalRecords]);

  const regions = useMemo(() => buildRegionSeries(filteredRecords, records, filters), [filteredRecords, records, filters]);
  const categoryTree = useMemo(() => buildCategoryTreemap(filteredRecords), [filteredRecords]);
  const providers = useMemo(() => buildProviderRanking(filteredRecords), [filteredRecords]);
  const analysts = useMemo(() => buildAnalystRanking(filteredRecords), [filteredRecords]);
  const executiveSummary = useMemo(() => buildExecutiveSummary(records, filteredRecords, filters), [records, filteredRecords, filters]);

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const parsed = await parseSpreadsheet(file);
      setRecords(parsed);
      setFileName(file.name);
      setFilters(defaultFilters);
    } finally {
      setLoading(false);
    }
  };

  // Format the globalStartDate for display in the helper text (dd/mm/yyyy)
  const globalStartLabel = globalStartDate
    ? new Date(`${globalStartDate}T00:00:00`).toLocaleDateString('pt-BR')
    : 'início';

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">BI corporativo sem backend</p>
          <h1>Desempenho da equipe com leitura direta da planilha</h1>
          <p>
            O painel analisa tickets, status, regiões, fornecedores e evolução temporal no próprio navegador,
            com visual inspirado em apresentação executiva.
          </p>
        </div>

        <div className="hero-meta">
          <div>
            <span className="meta-label">Empresa</span>
            <strong>{branding.companyName}</strong>
          </div>
          <div>
            <span className="meta-label">Período analisado</span>
            <strong>{records.length ? `${formatDateInput(records[0]?.requestDate)} até hoje` : branding.analysisPeriod}</strong>
          </div>
          <div>
            <span className="meta-label">Arquivo</span>
            <strong>{fileName || 'Nenhum arquivo carregado'}</strong>
          </div>
        </div>
      </header>

      <main className="content">
        <UploadPanel onFileSelected={handleFile} loading={loading} />

        {records.length > 0 ? (
          <>
            <FilterBar records={records} filters={filters} onChange={setFilters} />

            <section className="kpi-section">
              {/* "A partir de" field — controls only the global (second) value in each card */}
              <div className="kpi-section__toolbar">
                <span className="kpi-section__legend">Filtrado / Global a partir de</span>
                <div className="global-date-filter">
                  <label htmlFor="global-start-date" className="global-date-filter__label">
                    A partir de
                  </label>
                  <input
                    id="global-start-date"
                    type="date"
                    className="global-date-filter__input"
                    value={globalStartDate}
                    onChange={(e) => setGlobalStartDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="kpi-grid">
                <KpiCard
                  label="Total de chamados"
                  value={metrics.total.toString()}
                  globalValue={globalMetrics.total.toString()}
                  helper={`Filtrado / Global desde ${globalStartLabel}`}
                  progress={100}
                  tone="cyan"
                />
                <KpiCard
                  label="Backlog"
                  value={metrics.backlog.toString()}
                  globalValue={globalMetrics.backlog.toString()}
                  helper="Chamados em espera"
                  progress={metrics.total ? (metrics.backlog / metrics.total) * 100 : 0}
                  tone="amber"
                />
                <KpiCard
                  label="Em andamento"
                  value={metrics.inProgress.toString()}
                  globalValue={globalMetrics.inProgress.toString()}
                  helper="Itens ainda em atendimento"
                  progress={metrics.total ? (metrics.inProgress / metrics.total) * 100 : 0}
                  tone="amber"
                />
                <KpiCard
                  label="Concluídos"
                  value={metrics.concluded.toString()}
                  globalValue={globalMetrics.concluded.toString()}
                  helper="Chamados concluídos"
                  progress={metrics.completionRate}
                  tone="teal"
                />
                <KpiCard
                  label="Rejeitados"
                  value={metrics.rejected.toString()}
                  globalValue={globalMetrics.rejected.toString()}
                  helper="Chamados não aprovados"
                  progress={metrics.total ? (metrics.rejected / metrics.total) * 100 : 0}
                  tone="rose"
                />
                <KpiCard
                  label="Tempo médio"
                  value={`${metrics.avgSlaDays.toFixed(1)} / ${globalMetrics.avgSlaDays.toFixed(1)} dias`}
                  helper="Entre abertura e conclusão"
                  progress={Math.min(100, metrics.avgSlaDays * 10)}
                  tone="cyan"
                />
              </div>
            </section>

            <ChartsGrid regions={regions} categoryTree={categoryTree} executiveSummary={executiveSummary} />

            <PerformanceTable rows={providers} title="Fornecedores com mais impacto" subtitle="Ranking por volume, taxa de conclusão e tempo médio" />
            <PerformanceTable rows={analysts} title="Analistas responsáveis" subtitle="Leitura de produtividade individual após os filtros atuais" />
          </>
        ) : (
          <section className="empty-state">
            <h2>Importe a planilha para começar</h2>
            <p>
              Assim que o arquivo for carregado, os gráficos e tabelas serão montados automaticamente a partir dos dados
              da aba principal.
            </p>
          </section>
        )}
      </main>
    </div>
  );
};
