import * as XLSX from 'xlsx';
import { daysBetween, formatMonthLabel } from './date';
import type {
  CategoryPoint,
  CanonicalStatus,
  DashboardFilters,
  DashboardMetrics,
  MonthlyPoint,
  RankedItem,
  RegionPoint,
  SpreadsheetRecord,
} from '../types';

type HeaderMap = {
  ticketId: number | null;
  status: number | null;
  recurring: number | null;
  region: number | null;
  location: number | null;
  category: number | null;
  subcategory: number | null;
  provider: number | null;
  analyst: number | null;
  requester: number | null;
  requestDate: number | null;
  conclusionDate: number | null;
  visitDate: number | null;
  slaProgress: number | null;
};

// Known status keywords (checked by substring) to handle variants, typos and encoding issues
const concludedKeywords = ['conclu', 'finaliz', 'finalizado', 'finalizada', 'fechad', 'resolvid'];
const inProgressKeywords = ['em at', 'em atendimento', 'em andamento', 'andamento', 'abert', 'pendent', 'aguard'];
const rejectedKeywords = ['nao aprov', 'nao aprovado', 'n�o aprov', 'reprov', 'rejeit'];

const normalizeText = (value: unknown) => String(value ?? '').trim();
const normalizeKey = (value: unknown) => normalizeText(value).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

const toIso = (value: unknown) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) {
      return null;
    }

    const date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, parsed.S));
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  const text = normalizeText(value);
  if (!text) {
    return null;
  }

  const parsedDate = new Date(text);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
};

const matchesAny = (normalized: string, keywords: string[]) => keywords.some((k) => normalized.includes(k));

const canonicalStatus = (value: string): CanonicalStatus => {
  const normalized = normalizeKey(value);

  if (!normalized) return 'other';

  // Check rejected first as some words may overlap
  if (matchesAny(normalized, rejectedKeywords)) return 'rejected';

  if (matchesAny(normalized, concludedKeywords)) return 'concluded';

  if (matchesAny(normalized, inProgressKeywords)) return 'in_progress';

  return 'other';
};

// Map original status text to the display label the front-end should show.
// Rules requested:
// - 'Em Aberto' -> 'Backlog'
// - 'Pendente de Aprovação' -> treated as 'Em Atendimento' (label 'Em Atendimento')
// - 'Solicitação Finalizada' and 'Chamado Concluído' remain but are considered concluded by `statusGroup`
const statusDisplayLabel = (original: string) => {
  const normalized = normalizeKey(original);

  if (!normalized) return 'Não informado';

  if (matchesAny(normalized, ['em abert', 'em aberto'])) return 'Backlog';

  if (matchesAny(normalized, ['pendente de aprov', 'pendente de aprovacao'])) return 'Em Atendimento';

  // Preserve original text if possible (trimmed)
  return normalizeText(original);
};

const buildHeaderMap = (headers: unknown[]): HeaderMap => {
  const normalized = headers.map((header) => normalizeKey(header));
  const findIndex = (...patterns: string[]) => {
    for (let index = 0; index < normalized.length; index += 1) {
      if (patterns.some((pattern) => normalized[index].includes(pattern))) {
        return index;
      }
    }

    return null;
  };

  return {
    ticketId: findIndex('ticket'),
    status: findIndex('status'),
    recurring: findIndex('recorrente'),
    region: findIndex('praça', 'praca'),
    location: findIndex('local de atendimento'),
    category: findIndex('categoria'),
    subcategory: findIndex('subcategoria'),
    provider: findIndex('fornecedor'),
    analyst: findIndex('analista responsavel'),
    requester: findIndex('requisitante'),
    requestDate: findIndex('data da requisicao'),
    conclusionDate: findIndex('data da conclusao'),
    visitDate: findIndex('data da visita'),
    slaProgress: findIndex('progresso do sla'),
  };
};

const getValue = (row: unknown[], index: number | null) => (index === null ? '' : row[index] ?? '');

export const parseSpreadsheet = async (file: File): Promise<SpreadsheetRecord[]> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '' });

  const [headerRow, ...dataRows] = rows;
  const headers = Array.isArray(headerRow) ? headerRow : [];
  const map = buildHeaderMap(headers);

  return dataRows
    .filter((row) => Array.isArray(row) && row.some((value) => normalizeText(value)))
    .map((row) => {
      const rawStatusText = normalizeText(getValue(row, map.status));
      const status = statusDisplayLabel(rawStatusText);
      const requestDate = toIso(getValue(row, map.requestDate));
      const conclusionDate = toIso(getValue(row, map.conclusionDate));
      const visitDate = toIso(getValue(row, map.visitDate));

      return {
        ticketId: normalizeText(getValue(row, map.ticketId)),
        status,
        statusGroup: canonicalStatus(rawStatusText),
        recurring: normalizeText(getValue(row, map.recurring)),
        region: normalizeText(getValue(row, map.region)) || 'Não informado',
        location: normalizeText(getValue(row, map.location)) || 'Não informado',
        category: normalizeText(getValue(row, map.category)) || 'Não informado',
        subcategory: normalizeText(getValue(row, map.subcategory)) || 'Não informado',
        provider: normalizeText(getValue(row, map.provider)) || 'Sem fornecedor',
        analyst: normalizeText(getValue(row, map.analyst)) || 'Não informado',
        requester: normalizeText(getValue(row, map.requester)) || 'Não informado',
        requestDate,
        conclusionDate,
        visitDate,
        slaProgress: normalizeText(getValue(row, map.slaProgress)),
        rawStatus: status,
      } satisfies SpreadsheetRecord;
    });
};

export const defaultFilters: DashboardFilters = {
  query: '',
  region: 'all',
  status: 'all',
  category: 'all',
  provider: 'all',
  analyst: 'all',
  startDate: '',
  endDate: '',
};

export const applyFilters = (records: SpreadsheetRecord[], filters: DashboardFilters) =>
  records.filter((record) => {
    const normalizedQuery = filters.query.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      [record.ticketId, record.status, record.region, record.category, record.subcategory, record.provider, record.analyst]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);

    const matchesRegion = filters.region === 'all' || record.region === filters.region;
    const matchesStatus = filters.status === 'all' || record.status === filters.status;
    const matchesCategory = filters.category === 'all' || record.category === filters.category;
    const matchesProvider = filters.provider === 'all' || record.provider === filters.provider;
    const matchesAnalyst = filters.analyst === 'all' || record.analyst === filters.analyst;

    const requestDate = record.requestDate ? new Date(record.requestDate) : null;
    const matchesStartDate = !filters.startDate || !requestDate || requestDate >= new Date(filters.startDate);
    const matchesEndDate = !filters.endDate || !requestDate || requestDate <= new Date(`${filters.endDate}T23:59:59.999`);

    return (
      matchesQuery &&
      matchesRegion &&
      matchesStatus &&
      matchesCategory &&
      matchesProvider &&
      matchesAnalyst &&
      matchesStartDate &&
      matchesEndDate
    );
  });

export const buildMetrics = (records: SpreadsheetRecord[]): DashboardMetrics => {
  const total = records.length;
  const concluded = records.filter((record) => record.statusGroup === 'concluded').length;
  const inProgress = records.filter((record) => record.statusGroup === 'in_progress').length;
  const rejected = records.filter((record) => record.statusGroup === 'rejected').length;
  const completionRate = total ? (concluded / total) * 100 : 0;
  const slaWithDates = records
    .map((record) => daysBetween(record.requestDate, record.conclusionDate))
    .filter((value): value is number => value !== null);
  const avgSlaDays = slaWithDates.length ? slaWithDates.reduce((sum, value) => sum + value, 0) / slaWithDates.length : 0;

  return {
    total,
    concluded,
    inProgress,
    rejected,
    completionRate,
    avgSlaDays,
  };
};

export const buildRegionSeries = (records: SpreadsheetRecord[]): RegionPoint[] => {
  const accumulator = new Map<string, { volume: number; concluded: number }>();

  for (const record of records) {
    const current = accumulator.get(record.region) ?? { volume: 0, concluded: 0 };
    current.volume += 1;
    if (record.statusGroup === 'concluded') {
      current.concluded += 1;
    }
    accumulator.set(record.region, current);
  }

  return [...accumulator.entries()]
    .map(([region, value]) => ({
      region,
      volume: value.volume,
      concluded: value.concluded,
      completionRate: value.volume ? (value.concluded / value.volume) * 100 : 0,
    }))
    .sort((left, right) => right.volume - left.volume);
};

export const buildMonthlySeries = (records: SpreadsheetRecord[]): MonthlyPoint[] => {
  const accumulator = new Map<string, { month: string; concluded: number; inProgress: number }>();

  for (const record of records) {
    if (!record.requestDate) {
      continue;
    }

    const monthKey = record.requestDate.slice(0, 7);
    const current = accumulator.get(monthKey) ?? { month: formatMonthLabel(record.requestDate), concluded: 0, inProgress: 0 };
    if (record.statusGroup === 'concluded') {
      current.concluded += 1;
    } else if (record.statusGroup === 'in_progress') {
      current.inProgress += 1;
    }
    accumulator.set(monthKey, current);
  }

  return [...accumulator.entries()]
    .map(([monthKey, value]) => ({ monthKey, ...value }))
    .sort((left, right) => left.monthKey.localeCompare(right.monthKey));
};

const buildRank = (records: SpreadsheetRecord[], accessor: (record: SpreadsheetRecord) => string): RankedItem[] => {
  const accumulator = new Map<string, { volume: number; concluded: number; inProgress: number; days: number[] }>();

  for (const record of records) {
    const label = accessor(record);
    if (!label) {
      continue;
    }

    const current = accumulator.get(label) ?? { volume: 0, concluded: 0, inProgress: 0, days: [] };
    current.volume += 1;
    if (record.statusGroup === 'concluded') {
      current.concluded += 1;
      const days = daysBetween(record.requestDate, record.conclusionDate);
      if (days !== null) {
        current.days.push(days);
      }
    } else if (record.statusGroup === 'in_progress') {
      current.inProgress += 1;
    }
    accumulator.set(label, current);
  }

  return [...accumulator.entries()]
    .map(([label, value]) => ({
      label,
      volume: value.volume,
      concluded: value.concluded,
      inProgress: value.inProgress,
      completionRate: value.volume ? (value.concluded / value.volume) * 100 : 0,
      averageDaysToConclusion: value.days.length ? value.days.reduce((sum, day) => sum + day, 0) / value.days.length : null,
    }))
    .sort((left, right) => right.volume - left.volume)
    .slice(0, 10);
};

export const buildProviderRanking = (records: SpreadsheetRecord[]) => buildRank(records, (record) => record.provider);

export const buildCategoryRanking = (records: SpreadsheetRecord[]): CategoryPoint[] => {
  const ranking = buildRank(records, (record) => `${record.category} • ${record.subcategory}`);
  return ranking.map((item) => ({ label: item.label, volume: item.volume }));
};

export const buildAnalystRanking = (records: SpreadsheetRecord[]) => buildRank(records, (record) => record.analyst);

export const buildInsight = (records: SpreadsheetRecord[]) => {
  const regionRanking = buildRegionSeries(records);
  const providerRanking = buildProviderRanking(records);
  const openIssues = records.filter((record) => record.statusGroup === 'in_progress').length;
  const concluded = records.filter((record) => record.statusGroup === 'concluded').length;

  const topRegion = regionRanking[0];
  const topProvider = providerRanking.find((item) => item.volume >= 5) ?? providerRanking[0];
  const topBacklogStatus = records.reduce((accumulator, record) => {
    const key = record.status || 'Não informado';
    accumulator.set(key, (accumulator.get(key) ?? 0) + 1);
    return accumulator;
  }, new Map<string, number>());
  const biggestStatus = [...topBacklogStatus.entries()].sort((left, right) => right[1] - left[1])[0];

  return {
    headline: topRegion
      ? `${topRegion.region} lidera o volume com ${topRegion.volume} chamados e ${topRegion.completionRate.toFixed(1)}% de conclusão.`
      : 'Carregue a planilha para liberar a leitura de desempenho.',
    secondary: topProvider
      ? `${topProvider.label} concentra o melhor equilíbrio entre volume e fechamento, com ${topProvider.completionRate.toFixed(1)}% de conclusão.`
      : 'O ranking de fornecedores ficará visível após a importação.',
    action: openIssues > concluded
      ? `Há ${openIssues} itens em andamento; vale priorizar os status que mais concentram backlog, como ${biggestStatus?.[0] ?? 'n/d'}.`
      : 'A carteira está saudável e com mais entregas concluídas do que itens em andamento.',
  };
};

export const uniqueOptions = (records: SpreadsheetRecord[], selector: (record: SpreadsheetRecord) => string) =>
  [...new Set(records.map(selector).filter((value) => value && value !== 'Não informado'))].sort((left, right) =>
    left.localeCompare(right, 'pt-BR')
  );