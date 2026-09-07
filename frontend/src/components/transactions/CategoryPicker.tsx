import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import CategoryBadge from "@/components/CategoryBadge";
import type { Category } from "@/services/categories";

export const NO_CATEGORY = "none";

interface CategoryPickerProps {
  categories: Category[];
  type: "EXPENSE" | "INCOME";
  value: string;
  onSelect: (categoryId: string) => void;
}

// busca + grupos expansíveis — extraído do TransactionForm quando ganhou um
// segundo consumidor (edição inline em CategoryDetail); estado de busca e
// grupo aberto é só apresentação, fica interno ao componente
export default function CategoryPicker({
  categories,
  type,
  value,
  onSelect,
}: CategoryPickerProps) {
  const [search, setSearch] = useState("");
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const categoriesForType = categories.filter((c) => c.type === type);
  const selected = categoriesForType.find((c) => c.id === value);

  const groupedCategories = useMemo(() => {
    const map = new Map<
      string,
      { group: Category["group"]; items: Category[] }
    >();
    for (const category of categoriesForType) {
      const entry = map.get(category.group.id);
      if (entry) {
        entry.items.push(category);
      } else {
        map.set(category.group.id, {
          group: category.group,
          items: [category],
        });
      }
    }
    return Array.from(map.values());
  }, [categoriesForType]);

  const searchTerm = search.trim().toLowerCase();
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupedCategories;
    return groupedCategories
      .map(({ group, items }) => ({
        group,
        items: items.filter((item) =>
          item.name.toLowerCase().includes(searchTerm),
        ),
      }))
      .filter(({ items }) => items.length > 0);
  }, [groupedCategories, searchTerm]);

  function pick(id: string) {
    onSelect(id);
    setExpandedGroupId(null);
    setSearch("");
  }

  return (
    <div>
      {selected && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-primary bg-primary/10 p-2 text-sm">
          <CategoryBadge icon={selected.icon} color={selected.color} size={24} />
          <span className="min-w-0 flex-1 truncate font-medium">
            {selected.name}
          </span>
          <button
            type="button"
            onClick={() => pick(NO_CATEGORY)}
            className="text-xs text-muted-foreground underline"
          >
            trocar
          </button>
        </div>
      )}

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        type="text"
        placeholder="Buscar categoria"
        aria-label="Buscar categoria"
        className="py-2"
      />

      <div className="mt-2 space-y-2">
        {!selected && (
          <button
            type="button"
            onClick={() => pick(NO_CATEGORY)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border p-2 text-sm transition-colors",
              value === NO_CATEGORY
                ? "border-primary bg-primary/10"
                : "hover:bg-muted",
            )}
          >
            <span className="size-6 rounded-full bg-muted-foreground/30" />
            Sem categoria
          </button>
        )}

        {filteredGroups.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma categoria encontrada.
          </p>
        ) : (
          filteredGroups.map(({ group, items }) => {
            const isExpanded =
              Boolean(searchTerm) || expandedGroupId === group.id;
            return (
              <div
                key={group.id}
                className="overflow-hidden rounded-lg border"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedGroupId(
                      expandedGroupId === group.id ? null : group.id,
                    )
                  }
                  className="flex w-full items-center gap-3 p-2 text-left text-sm"
                >
                  <CategoryBadge icon={group.icon} color={group.color} size={28} />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {group.name}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={16} className="text-muted-foreground" />
                  )}
                </button>
                {isExpanded && (
                  <div className="grid grid-cols-3 gap-2 border-t p-2">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => pick(item.id)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors",
                          value === item.id
                            ? "border-primary bg-primary/10"
                            : "hover:bg-muted",
                        )}
                      >
                        <CategoryBadge icon={item.icon} color={item.color} size={28} />
                        {item.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
