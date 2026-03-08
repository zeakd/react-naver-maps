export interface NavItem {
  title: string;
  slug: string;
  order: number;
}

export interface NavCategory {
  name: string;
  items: NavItem[];
}

export interface DocEntry {
  slug: string;
  data: {
    title: string;
    category: string;
    order?: number;
    menuName?: string;
    hidden?: boolean;
  };
}

/**
 * Build navigation structure from Content Collection entries.
 * Groups by `category` and sorts by `order` or filename numeric prefix.
 */
export function buildNavigation(entries: DocEntry[]): NavCategory[] {
  const categories = new Map<string, NavItem[]>();

  for (const entry of entries) {
    if (entry.data.hidden) continue;

    const category = entry.data.category;
    if (!categories.has(category)) {
      categories.set(category, []);
    }

    const order = entry.data.order ?? extractNumericPrefix(entry.slug);

    categories.get(category)!.push({
      title: entry.data.menuName ?? entry.data.title,
      slug: entry.slug,
      order,
    });
  }

  const result: NavCategory[] = [];
  for (const [name, items] of categories) {
    items.sort((a, b) => a.order - b.order);
    result.push({ name, items });
  }

  return result;
}

/**
 * Extract numeric prefix from a slug for ordering.
 * e.g., "guides/01-introduction" → 1, "guides/getting-started" → Infinity
 */
function extractNumericPrefix(slug: string): number {
  const filename = slug.split('/').pop() ?? '';
  const match = filename.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : Infinity;
}
