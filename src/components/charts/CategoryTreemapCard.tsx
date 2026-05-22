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

const transformValueForLayout = (value: number): number => {
  // Use square root to maintain order but reduce proportionality
  return Math.sqrt(value);
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
        value: transformValueForLayout(category.value),
        children: buildCategoryChildren(category, color).map((child) => ({
          ...child,
          value: transformValueForLayout(child.value),
        })),
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
        value: transformValueForLayout(subcategory.value),
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
        value: transformValueForLayout(remainingValue),
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
      value: transformValueForLayout(othersValue),
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
  } = props;

  if (width < 46 || height < 34) return null;

  const isCategory = depth === 1 && !subcategory;
  const isSubcategory = depth >= 2 || Boolean(subcategory);

  const label = subcategory ?? name;

  if (isCategory) {
    const headerHeight = 40;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="#f8f8f8"
          stroke="none"
        />

        <rect
          x={x}
          y={y}
          width={width}
          height={headerHeight}
          fill={fill}
          stroke="none"
        />

        <rect
          x={x}
          y={y + headerHeight}
          width={width}
          height={1}
          fill="rgba(255,255,255,0.4)"
          stroke="none"
        />

        {width >= 110 && height >= 70 && (
          <text
            x={x + 10}
            y={y + 22}
            fill="#ffffff"
            fontSize={11}
            fontWeight={700}
            pointerEvents="none"
          >
            {label.substring(0, 28)}
          </text>
        )}

        {width >= 130 && height >= 70 && (
          <text
            x={x + 10}
            y={y + 36}
            fill="#ffffff"
            fontSize={10}
            fontWeight={600}
            opacity={0.95}
            pointerEvents="none"
          >
            {formatNumber(total ?? value)} • {formatPercent(shareOfTotal)}
          </text>
        )}
      </g>
    );
  }

  if (!isSubcategory) return null;

  const showFull = width >= 150 && height >= 95;
  const showMedium = width >= 115 && height >= 66;
  const showValueOnly = width >= 72 && height >= 44;
  const showNameOnly = width >= 50 && height >= 30;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke="none"
      />

      {showFull && (
        <text
          x={x + 10}
          y={y + 65}
          fill="#0f172a"
          fontSize={12}
          fontWeight={700}
          pointerEvents="none"
        >
          <tspan x={x + 10}>{label.substring(0, 25)}</tspan>
          <tspan x={x + 10} dy="24" fontSize={18} fontWeight={900}>
            {formatNumber(value)}
          </tspan>
          <tspan x={x + 10} dy="16" fontSize={11} fontWeight={600}>
            {formatPercent(shareOfTotal)}
          </tspan>
        </text>
      )}

      {!showFull && showMedium && (
        <text
          x={x + 10}
          y={y + 55}
          fill="#0f172a"
          fontSize={11}
          fontWeight={700}
          pointerEvents="none"
        >
          <tspan x={x + 10}>{label.substring(0, 18)}</tspan>
          <tspan x={x + 10} dy={20} fontSize={16} fontWeight={900}>
            {formatNumber(value)}
          </tspan>
        </text>
      )}

      {!showFull && !showMedium && showValueOnly && (
        <text
          x={x + 10}
          y={y + height / 2 + 6}
          fill="#0f172a"
          fontSize={14}
          fontWeight={900}
          pointerEvents="none"
        >
          {formatNumber(value)}
        </text>
      )}

      {!showFull && !showMedium && !showValueOnly && showNameOnly && (
        <text
          x={x + 10}
          y={y + height / 2 + 4}
          fill="#0f172a"
          fontSize={9}
          fontWeight={700}
          pointerEvents="none"
        >
          {label.substring(0, 12)}
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