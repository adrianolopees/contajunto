import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

interface BudgetBarProps {
  spent: number;
  budget: number;
}

// usado sob o cabeçalho de cada grupo de categoria no Dashboard, só quando
// o grupo já tem teto configurado (ver Profile > Teto por categoria) — quem
// chama decide se renderiza ou não, então aqui budget nunca é "sem teto"
export default function BudgetBar({ spent, budget }: BudgetBarProps) {
  const ratio = budget > 0 ? spent / budget : 0;
  const remaining = budget - spent;
  const isOver = remaining < 0;

  const fill = isOver
    ? "bg-red-500"
    : ratio >= 0.8
      ? "bg-amber-500"
      : "bg-primary";

  return (
    <div className="space-y-1">
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", fill)}
          style={{ width: `${Math.min(ratio * 100, 100)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {formatCurrency(spent)} de {formatCurrency(budget)} ·{" "}
        <span
          className={cn(
            isOver && "font-medium text-red-600 dark:text-red-500",
          )}
        >
          {isOver
            ? `${formatCurrency(-remaining)} acima`
            : `faltam ${formatCurrency(remaining)}`}
        </span>
      </p>
    </div>
  );
}
