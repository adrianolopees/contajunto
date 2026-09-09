import { createElement } from "react";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { useTheme } from "@/hooks/useTheme";

interface CategoryBadgeProps {
  icon: string;
  color: string;
  size?: number;
  className?: string;
  // solid: preenchimento chapado, ícone branco — padrão, usado em badges
  // avulsos (sem um "filho" subtle ao lado pra destoar)
  // subtle: badge de subcategoria — tingido no claro, contorno+glow no escuro
  // bold: badge de categoria-pai quando aparece ao lado de subcategorias
  // subtle — no claro se comporta como solid; só o escuro ganha tratamento
  // translúcido, pra pai e filho parecerem a mesma "família" de vidro em vez
  // de duas linguagens visuais diferentes (chapado vs. neon)
  variant?: "solid" | "subtle" | "bold";
}

export default function CategoryBadge({
  icon,
  color,
  size = 36,
  className,
  variant = "solid",
}: CategoryBadgeProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  let backgroundColor: string = color;
  let border: string | undefined;
  let boxShadow: string | undefined;
  let iconColor: string | undefined;
  let iconClassName: string | undefined = "text-white";

  if (variant === "subtle") {
    iconColor = color;
    iconClassName = undefined;
    if (isDark) {
      backgroundColor = "transparent";
      border = `1px solid ${color}`;
      boxShadow = `0 0 6px color-mix(in srgb, ${color} 35%, transparent)`;
    } else {
      backgroundColor = `color-mix(in srgb, ${color} 15%, transparent)`;
    }
  } else if (variant === "bold" && isDark) {
    backgroundColor = `color-mix(in srgb, ${color} 30%, transparent)`;
    boxShadow = `0 0 4px color-mix(in srgb, ${color} 25%, transparent)`;
    iconColor = color;
    iconClassName = undefined;
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        className,
      )}
      style={{ backgroundColor, border, boxShadow, width: size, height: size }}
    >
      {/* createElement em vez de <Icon/>: o componente é escolhido por nome a
          partir de um mapa fixo (identidade estável), não criado no render —
          é o que a regra react-hooks/static-components não consegue ver */}
      {createElement(getCategoryIcon(icon), {
        size: size * 0.55,
        className: iconClassName,
        style: iconColor ? { color: iconColor } : undefined,
      })}
    </div>
  );
}
