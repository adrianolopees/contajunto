import type React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

interface BudgetBarProps {
  spent: number;
  budget: number;
  /** cor da categoria-pai (hex ou CSS var) — intensidade animada pelo ratio */
  color?: string;
}

// usado sob o cabeçalho de cada grupo de categoria no Dashboard, só quando
// o grupo já tem teto configurado (ver Profile > Teto por categoria) — quem
// chama decide se renderiza ou não, então aqui budget nunca é "sem teto"
export default function BudgetBar({ spent, budget, color }: BudgetBarProps) {
  const ratio = budget > 0 ? spent / budget : 0;
  const remaining = budget - spent;
  const isOver = remaining < 0;

  // opacidade: 0.3 (zerado) → 1.0 (limite ou acima)
  // a barra começa "apagada" e vai ficando sólida conforme gasta
  const fillOpacity = 0.3 + Math.min(ratio, 1) * 0.7;

  // neon glow: começa a aparecer em 50% e satura em 100%;
  // no dark mode o glow fica muito visível; no light é sutil mas presente
  const glowProgress = Math.max(0, (Math.min(ratio, 1) - 0.5) / 0.5);
  const glowPx = Math.round(glowProgress * 8); // até 8px de blur

  const fillStyle: React.CSSProperties = color
    ? {
        width: `${Math.min(ratio * 100, 100)}%`,
        backgroundColor: color,
        opacity: fillOpacity,
        ...(glowPx > 0 ? { boxShadow: `0 0 ${glowPx}px ${color}` } : {}),
        // quando estourado: brilho extra pra sinalizar sem virar vermelho
        ...(isOver ? { filter: "brightness(1.3)" } : {}),
      }
    : { width: `${Math.min(ratio * 100, 100)}%` };

  return (
    <div className="space-y-1">
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            !color && (isOver ? "bg-red-500" : "bg-primary"),
          )}
          style={fillStyle}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {formatCurrency(spent)} de {formatCurrency(budget)} ·{" "}
        <span className={cn(isOver && "font-medium")}>
          {isOver
            ? `${formatCurrency(-remaining)} acima`
            : `faltam ${formatCurrency(remaining)}`}
        </span>
      </p>
    </div>
  );
}
