import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

interface BudgetBarProps {
  spent: number;
  budget: number | null;
  isCurrentMonth: boolean;
}

export default function BudgetBar({
  spent,
  budget,
  isCurrentMonth,
}: BudgetBarProps) {
  if (budget === null) {
    return (
      <Link
        to="/me"
        className="flex items-center justify-between rounded-xl border border-dashed p-3 text-sm text-muted-foreground"
      >
        <span>Defina um teto de gastos pro mês</span>
        <span className="font-medium text-primary">Definir</span>
      </Link>
    );
  }

  const ratio = budget > 0 ? spent / budget : 0;
  const remaining = budget - spent;

  const fillColor =
    ratio >= 1 ? "bg-expense" : ratio >= 0.8 ? "bg-amber-500" : "bg-income";

  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const projection =
    isCurrentMonth && dayOfMonth >= 3
      ? (spent / dayOfMonth) * daysInMonth
      : null;

  return (
    <div className="rounded-xl border p-3">
      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="font-medium">Teto do mês</span>
        <span className="text-muted-foreground">
          {formatCurrency(spent)} de {formatCurrency(budget)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", fillColor)}
          style={{ width: `${Math.min(ratio * 100, 100)}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs">
        <span
          className={cn(
            remaining < 0
              ? "font-medium text-expense"
              : "text-muted-foreground",
          )}
        >
          {remaining >= 0
            ? `Faltam ${formatCurrency(remaining)}`
            : `${formatCurrency(-remaining)} acima`}
        </span>
        {projection !== null && (
          <span className="text-muted-foreground">
            Projeção: {formatCurrency(projection)}
          </span>
        )}
      </div>
    </div>
  );
}
