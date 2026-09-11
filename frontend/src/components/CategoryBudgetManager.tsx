import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import CategoryBadge from "@/components/CategoryBadge";
import CurrencyInput from "@/components/CurrencyInput";
import { getCategories, type CategoryGroup } from "@/services/categories";
import {
  getCategoryGroupBudgets,
  setCategoryGroupBudgets,
} from "@/services/categoryBudgets";

// teto de gasto mensal por categoria-pai — substitui o antigo teto único
// (User.monthlyBudget). Cada grupo é opcional: sem valor aqui (0, tratado
// como "vazio") não manda linha nenhuma pro backend, e o Dashboard não
// mostra barra pra ele
export default function CategoryBudgetManager() {
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [categories, budgets] = await Promise.all([
          getCategories(),
          getCategoryGroupBudgets(),
        ]);

        const expenseGroups = new Map<string, CategoryGroup>();
        for (const category of categories) {
          if (category.type === "EXPENSE") {
            expenseGroups.set(category.group.id, category.group);
          }
        }

        setGroups(
          Array.from(expenseGroups.values()).sort((a, b) =>
            a.name.localeCompare(b.name, "pt-BR"),
          ),
        );
        setAmounts(
          Object.fromEntries(
            budgets.map((b) => [b.groupId, Number(b.amount)]),
          ),
        );
      } catch {
        toast.error("Não foi possível carregar os tetos por categoria.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    try {
      const budgets = groups.map((group) => {
        const value = amounts[group.id] ?? 0;
        return { groupId: group.id, amount: value > 0 ? value : null };
      });
      const updated = await setCategoryGroupBudgets(budgets);
      setAmounts(
        Object.fromEntries(updated.map((b) => [b.groupId, Number(b.amount)])),
      );
      toast.success("Tetos atualizados!");
    } catch {
      toast.error("Erro ao salvar os tetos. Tente novamente.");
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {groups.map((group) => (
          <li
            key={group.id}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            <CategoryBadge
              icon={group.icon}
              color={group.color}
              size={32}
              variant="subtle"
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {group.name}
            </span>
            <CurrencyInput
              value={amounts[group.id] ?? 0}
              onChange={(value) =>
                setAmounts((prev) => ({ ...prev, [group.id]: value }))
              }
              className="w-28 text-right"
            />
          </li>
        ))}
      </ul>
      <Button type="button" onClick={handleSave} className="w-full">
        Salvar tetos
      </Button>
    </div>
  );
}
