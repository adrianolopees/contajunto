import { createElement } from "react";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/categoryIcons";

interface CategoryBadgeProps {
  icon: string;
  color: string;
  size?: number;
  className?: string;
}

export default function CategoryBadge({
  icon,
  color,
  size = 36,
  className,
}: CategoryBadgeProps) {
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full", className)}
      style={{ backgroundColor: color, width: size, height: size }}
    >
      {/* createElement em vez de <Icon/>: o componente é escolhido por nome a
          partir de um mapa fixo (identidade estável), não criado no render —
          é o que a regra react-hooks/static-components não consegue ver */}
      {createElement(getCategoryIcon(icon), {
        size: size * 0.55,
        className: "text-white",
      })}
    </div>
  );
}
