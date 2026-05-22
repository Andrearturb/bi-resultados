import { ResponsiveContainer, Tooltip, Treemap } from 'recharts';
import type { CategoryTreemapNode } from '../../types';
import './categoryTreemap.css';

type Props = {
  categoryTree: CategoryTreemapNode[];
};

type TreemapNode = CategoryTreemapNode & {
  depth?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  fill?: string;
  stroke?: string;
};

const CATEGORY_COLORS = [
  '#1D5FAF',
  '#0F8F83',
  '#7C5FD6',
  '#D89A16',
  '#D94F5C',
  '#2AA198',
  '#64748B',
];

const formatPercent = (value?: number) =>
  typeof value === 'number' ? `${value.toFixed(1).replace('.', ',')}%` : '-';

const formatNumber = (value?: number) =>
  typeof value === 'number' ? value.toLocaleString('pt-BR') : '-';

const truncate = (text = '', max = 26) =>
  text.length > max ? `${text.slice(0, max)}...` : text;

const getVisibleSubcategoryCount = (categoryShare: number): number => {
  if (categoryShare >= 15) return 3;
  if (categoryShare >= 8) return 2;
  if (categoryShare >= 5) return 1;
  return 0;
};

const buildCategoryChildren = (
  category: CategoryTreemapNode,
  color: string
): CategoryTreemapNode[] => {
  const visibleCount = getVisibleSubcategoryCount(category.shareOfTotal);

  const sortedChildren = [...(category.children ?? [])].sort(
    (a, b) => b.value - a.value
  );

  const visibleChildren = sortedChildren.slice(0, visibleCount);
  const hiddenChildren = sortedChildren.slice(visibleCount);

  const result: CategoryTreemapNode[] = visibleChildren.map(
    (child, childIndex) => ({
      ...child,
      fill: `${color}${childIndex === 0 ? '30' : childIndex === 1 ? '42' : '52'}`,
    })
  );

  if (hiddenChildren.length > 0) {
    const hiddenValue = hiddenChildren.reduce((sum, item) => sum + item.value, 0);
    const hiddenShareOfTotal = hiddenChildren.reduce(
      (sum, item) => sum + item.shareOfTotal,
      0
    );
    const hiddenShareOfCategory = hiddenChildren.reduce(
      (sum, item) => sum + item.shareOfCategory,
      0
    );

    result.push({
      name: 'Outras subcategorias',
      category: category.category,
      subcategory: 'Outras subcategorias',
      value: hiddenValue,
      total: hiddenValue,
      shareOfCategory: hiddenShareOfCategory,
      shareOfTotal: hiddenShareOfTotal,
      fill: `${color}18`,
      stroke: 'transparent',
    });
  }

  return result;
};

const consolidateSubcategories = (categories: CategoryTreemapNode[]): any => {
  const consolidated: Record<string, any> = {};

  for (const category of categories) {
    for (const subcategory of category.children ?? []) {
      const key = subcategory.subcategory || subcategory.name;

      if (!consolidated[key]) {
        consolidated[key] = {
          ...subcategory,
          value: 0,
          total: 0,
          shareOfTotal: 0,
          shareOfCategory: 0,
        };
      }

      consolidated[key].value += subcategory.value;
      consolidated[key].total += subcategory.value;
      consolidated[key].shareOfTotal += subcategory.shareOfTotal;
      consolidated[key].shareOfCategory += subcategory.shareOfCategory;
    }
  }

  return Object.values(consolidated)
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 2);
};

const buildExecutiveTreemap = (tree: CategoryTreemapNode[]) => {
  const sortedCategories = [...tree].sort((a, b) => b.value - a.value);

  const mainCategories = sortedCategories.filter((c) => c.shareOfTotal >= 5);
  const smallCategories = sortedCategories.filter((c) => c.shareOfTotal < 5);

  const result: CategoryTreemapNode[] = mainCategories.map(
    (category, index) => {
      const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
      return {
        ...category,
        fill: color,
        children: buildCategoryChildren(category, color),
      };
    }
  );

  if (smallCategories.length > 0) {
    const othersValue = smallCategories.reduce(
      (sum, item) => sum + item.value,
      0
    );
    const othersTotal = smallCategories.reduce(
      (sum, item) => sum + item.total,
      0
    );
    const othersShareOfTotal = smallCategories.reduce(
      (sum, item) => sum + item.shareOfTotal,
      0
    );

    const consolidatedSubcategories = consolidateSubcategories(smallCategories);
    const consolidatedValue = consolidatedSubcategories.reduce(
      (sum: number, item: any) => sum + item.value,
      0
    );

    const othersChildren: CategoryTreemapNode[] = consolidatedSubcategories.map(
      (subcategory: any) => ({
        ...subcategory,
        category: 'Outras categorias',
        fill: '#9CA3AF',
      })
    );

    if (
      consolidatedValue < othersValue &&
      consolidatedSubcategories.length > 0
    ) {
      const remainingValue = othersValue - consolidatedValue;
      othersChildren.push({
        name: 'Outras subcategorias',
        category: 'Outras categorias',
        subcategory: 'Outras subcategorias',
        value: remainingValue,
        total: remainingValue,
        shareOfCategory: 100 - consolidatedSubcategories.reduce(
          (sum: number, item: any) => sum + item.shareOfCategory,
          0
        ),
        shareOfTotal: othersShareOfTotal - consolidatedSubcategories.reduce(
          (sum: number, item: any) => sum + item.shareOfTotal,
          0
        ),
        fill: '#D1D5DB',
        stroke: 'transparent',
      });
    }

    result.push({
      name: 'Outras categorias',
      category: 'Outras categorias',
      value: othersValue,
      total: othersTotal,
      shareOfCategory: 100,
      shareOfTotal: othersShareOfTotal,
      fill: '#6B7280',
      stroke: 'transparent',
      children: othersChildren,
    });
  }

  return result;
};
const TreemapTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: TreemapNode }>;
}) => {
  if (!active || !payload?.length || !payload[0]?.payload) return null;

  const node = payload[0].payload;
  const isSubcategory = Boolean(node.subcategory);

  return (
    <div className="category-treemap-tooltip">
      <div className="category-treemap-tooltip__title">
        {isSubcategory ? node.subcategory : node.category ?? node.name}
      </div>

      {isSubcategory && (
        <div className="category-treemap-tooltip__row">
          <span>Categoria</span>
          <strong>{node.category}</strong>
        </div>
      )}

      <div className="category-treemap-tooltip__row">
        <span>Chamados</span>
        <strong className="category-treemap-tooltip__value--primary">
          {formatNumber(node.total ?? node.value)}
        </strong>
      </div>

      {isSubcategory && (
        <div className="category-treemap-tooltip__row">
          <span>% da categoria</span>
          <strong>{formatPercent(node.shareOfCategory)}</strong>
        </div>
      )}

      <div className="category-treemap-tooltip__row">
        <span>% do total</span>
        <strong>{formatPercent(node.shareOfTotal)}</strong>
      </div>
    </div>
  );
};

const TreemapCell = (props: Partial<TreemapNode>) => {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    depth = 1,
    name = '',
    value = 0,
    total = 0,
    shareOfTotal = 0,
    fill = '#E8F1FA',
    subcategory,
    category,
  } = props;

  if (width < 46 || height < 34) return null;

  const isCategory = depth === 1 && !subcategory;
  const isSubcategory = depth >= 2 || Boolean(subcategory);

  const padding = 12;
  const label = subcategory ?? name;

  const showFull = width >= 150 && height >= 95;
  const showMedium = width >= 115 && height >= 66;
  const showValueOnly = width >= 72 && height >= 44;

  if (isCategory) {
    const headerHeight = 32;

    return (
      <g>
        <rect
          x={x + 3}
          y={y + 3}
          width={Math.max(width - 6, 0)}
          height={Math.max(height - 6, 0)}
          rx={16}
          ry={16}
          fill="#ffffff"
          stroke="#ffffff"
          strokeWidth={3}
        />

        <rect
          x={x + 3}
          y={y + 3}
          width={Math.max(width - 6, 0)}
          height={headerHeight}
          rx={16}
          ry={16}
          fill={fill}
        />

        {width >= 120 && height >= 58 && (
          <text
            x={x + padding + 3}
            y={y + 20}
            fill="#ffffff"
            fontSize={12}
            fontWeight={700}
            pointerEvents="none"
          >
            <tspan x={x + padding + 3}>{truncate(category ?? name, 32)}</tspan>
          </text>
        )}

        {width >= 140 && height >= 58 && (
          <text
            x={x + padding + 3}
            y={y + 28}
            fill="#ffffff"
            fontSize={11}
            fontWeight={600}
            pointerEvents="none"
          >
            {formatNumber(total ?? value)} • {formatPercent(shareOfTotal)}
          </text>
        )}
      </g>
    );
  }

  if (!isSubcategory) return null;

  return (
    <g>
      <rect
        x={x + 3}
        y={y + 3}
        width={Math.max(width - 6, 0)}
        height={Math.max(height - 6, 0)}
        rx={12}
        ry={12}
        fill={fill}
        stroke="#ffffff"
        strokeWidth={3}
      />

      {showFull && (
        <text
          x={x + padding + 3}
          y={y + 26}
          fill="#0f172a"
          fontSize={12}
          fontWeight={700}
          pointerEvents="none"
        >
          <tspan x={x + padding + 3}>{truncate(label, 25)}</tspan>
          <tspan x={x + padding + 3} dy="24" fontSize={20} fontWeight={900}>
            {formatNumber(value)}
          </tspan>
          <tspan x={x + padding + 3} dy="18" fontSize={12} fontWeight={600}>
            {formatPercent(shareOfTotal)} do total
          </tspan>
        </text>
      )}

      {!showFull && showMedium && (
        <text
          x={x + padding + 3}
          y={y + 24}
          fill="#0f172a"
          fontSize={12}
          fontWeight={700}
          pointerEvents="none"
        >
          <tspan x={x + padding + 3}>{truncate(label, 18)}</tspan>
          <tspan x={x + padding + 3} dy="22" fontSize={17} fontWeight={900}>
            {formatNumber(value)}
          </tspan>
        </text>
      )}

      {!showFull && !showMedium && showValueOnly && (
        <text
          x={x + padding + 3}
          y={y + 27}
          fill="#0f172a"
          fontSize={15}
          fontWeight={900}
          pointerEvents="none"
        >
          {formatNumber(value)}
        </text>
      )}
    </g>
  );
};

export const CategoryTreemapCard = ({ categoryTree }: Props) => {
  const data = buildExecutiveTreemap(categoryTree);

  return (
    <article className="chart-card chart-card--wide chart-card--treemap">
      <div className="chart-header">
        <div>
          <p className="eyebrow">Categorias</p>
          <h3>Categorias e Subcategorias com mais chamados</h3>
          <p className="muted chart-subtitle">
            Hierarquia executiva por categoria e subcategoria
          </p>
        </div>
      </div>

      <section className="treemap-shell">
        <ResponsiveContainer width="100%" height={580}>
          <Treemap
            data={data}
            dataKey="value"
            nameKey="name"
            aspectRatio={2.8}
            content={<TreemapCell />}
            isAnimationActive={false}
          >
            <Tooltip content={<TreemapTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </section>

      <div className="treemap-legendless-note">
        Cada grupo representa uma categoria. Os blocos internos representam subcategorias,
        com tamanho proporcional ao volume de chamados.
      </div>
    </article>
  );
};