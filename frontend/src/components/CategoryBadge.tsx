import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

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
  const Icon = Icons[icon as keyof typeof Icons] as Icons.LucideIcon;

  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full", className)}
      style={{ backgroundColor: color, width: size, height: size }}
    >
      {Icon && <Icon size={size * 0.55} className="text-white" />}
    </div>
  );
}
