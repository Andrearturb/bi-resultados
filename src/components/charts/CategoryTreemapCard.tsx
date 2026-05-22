import type { CategoryTreemapNode } from '../../types';
import './categoryTreemap.css';

type Props = {
  categoryTree: CategoryTreemapNode[];
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

const CategoryCard = ({
  category,
  color,
}: {
  category: CategoryTreemapNode;
  color: string;
}) => {
  const sortedSubcategories = [...(category.children ?? [])].sort(
    (a, b) => b.value - a.value
  );

  return (
    <div
      className="category-card"
      style={{
        borderTopColor: color,
      }}
    >
      <div className="category-card__header" style={{ backgroundColor: color }}>
        <div className="category-card__title">
          {category.name}
        </div>
        <div className="category-card__meta">
          {formatNumber(category.value)} • {formatPercent(category.shareOfTotal)}
        </div>
      </div>

      <div className="category-card__grid">
        {sortedSubcategories.map((sub) => (
          <div
            key={`${sub.category}-${sub.subcategory}`}
            className="category-card__item"
          >
            <div className="category-card__item-name">
              {sub.name}
            </div>
            <div className="category-card__item-value">
              {formatNumber(sub.value)}
            </div>
            <div className="category-card__item-percent">
              {formatPercent(sub.shareOfTotal)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SubcategoryRow = ({
  subcategory,
  color,
}: {
  subcategory: CategoryTreemapNode;
  color: string;
}) => {
  return (
    <div
      className="subcategory-row"
      style={{
        borderLeftColor: color,
      }}
    >
      <div className="subcategory-row__name">{subcategory.name}</div>
      <div className="subcategory-row__value">
        {formatNumber(subcategory.value)}
      </div>
      <div className="subcategory-row__percent">
        {formatPercent(subcategory.shareOfTotal)}
      </div>
    </div>
  );
};


export const CategoryTreemapCard = ({ categoryTree }: Props) => {
  const data = buildExecutiveTreemap(categoryTree);

  const mainCategories = data.filter((c) => c.name !== 'Outras categorias');
  const othersCategory = data.find((c) => c.name === 'Outras categorias');

  return (
    <article className="chart-card chart-card--wide chart-card--grid-treemap">
      <div className="chart-header">
        <div>
          <p className="eyebrow">Categorias</p>
          <h3>Categorias e Subcategorias com mais chamados</h3>
          <p className="muted chart-subtitle">
            Hierarquia executiva por categoria e subcategoria
          </p>
        </div>
      </div>

      <section className="treemap-grid">
        {mainCategories.map((category, index) => (
          <CategoryCard
            key={category.name}
            category={category}
            color={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
          />
        ))}

        {othersCategory && (
          <div className="category-card category-card--others">
            <div className="category-card__header" style={{ backgroundColor: '#6B7280' }}>
              <div className="category-card__title">
                {othersCategory.name}
              </div>
              <div className="category-card__meta">
                {formatNumber(othersCategory.value)} • {formatPercent(othersCategory.shareOfTotal)}
              </div>
            </div>

            <div className="category-card__subcats">
              {(othersCategory.children ?? []).map((sub) => (
                <SubcategoryRow
                  key={`${sub.category}-${sub.subcategory}`}
                  subcategory={sub}
                  color="#9CA3AF"
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="treemap-legendless-note">
        Cada grupo representa uma categoria com suas subcategorias mais relevantes.
        Categorias com menos de 5% do total são consolidadas em "Outras categorias".
      </div>
    </article>
  );
};