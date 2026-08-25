import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { CategoryGroup } from "@/services/categories";
import CategoryBadge from "@/components/CategoryBadge";
import { formatCurrency } from "@/lib/format";

interface CategoryGroupEntry<T> {
  group: CategoryGroup;
  items: T[];
  total: number;
}

interface ExpandableCategoryGroupsProps<T> {
  groups: CategoryGroupEntry<T>[];
  totalForPercentage: number;
  getItemKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
}

export default function ExpandableCategoryGroups<T>({
  groups,
  totalForPercentage,
  getItemKey,
  renderItem,
}: ExpandableCategoryGroupsProps<T>) {
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  return (
    <ul className="space-y-2">
      {groups.map(({ group, items, total }) => {
        const isExpanded = expandedGroupId === group.id;
        const percentage =
          totalForPercentage > 0
            ? Math.round((total / totalForPercentage) * 100)
            : 0;

        return (
          <li
            key={group.id}
            className="overflow-hidden rounded-lg border bg-card"
          >
            <button
              type="button"
              onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
              className="flex w-full items-center gap-3 p-3 text-left"
            >
              <CategoryBadge icon={group.icon} color={group.color} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{group.name}</p>
                <p className="text-xs text-muted-foreground">
                  {percentage}%
                </p>
              </div>
              <p className="shrink-0 text-sm font-medium">
                {formatCurrency(total)}
              </p>
              {isExpanded ? (
                <ChevronUp
                  size={18}
                  className="shrink-0 text-muted-foreground"
                />
              ) : (
                <ChevronDown
                  size={18}
                  className="shrink-0 text-muted-foreground"
                />
              )}
            </button>
            {isExpanded && (
              <ul className="divide-y border-t">
                {items.map((item) => (
                  <li key={getItemKey(item)}>{renderItem(item)}</li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
