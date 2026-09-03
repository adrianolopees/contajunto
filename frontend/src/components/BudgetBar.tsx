import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

interface BudgetBarProps {
  spent: number;
  budget: number | null;
}

// renderizado dentro do card de saldo (bg-primary), por isso texto branco / trilho translúcido
export default function BudgetBar({ spent, budget }: BudgetBarProps) {
  if (budget === null) {
    return (
      <Link to="/me" className="block text-xs underline opacity-80">
        Definir teto de gastos do mês
      </Link>
    );
  }

  const ratio = budget > 0 ? spent / budget : 0;
  const remaining = budget - spent;
  const isOver = remaining < 0;

  const fill = isOver
    ? "bg-red-300"
    : ratio >= 0.8
      ? "bg-amber-300"
      : "bg-white/90";

  return (
    <div className="space-y-1">
      <div className="h-2 overflow-hidden rounded-full bg-white/20">
        <div
          className={cn("h-full rounded-full transition-all", fill)}
          style={{ width: `${Math.min(ratio * 100, 100)}%` }}
        />
      </div>
      <p className="text-xs opacity-80">
        {formatCurrency(spent)} de {formatCurrency(budget)}
      </p>
      <p
        className={cn("text-xs", isOver ? "font-semibold" : "opacity-80")}
      >
        {isOver
          ? `${formatCurrency(-remaining)} acima`
          : `Faltam ${formatCurrency(remaining)}`}
      </p>
    </div>
  );
}
