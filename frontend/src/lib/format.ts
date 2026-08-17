export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatRelativeDay(date: string | Date): string {
  const target = new Date(date);
  const today = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const diffDays = Math.round(
    (startOfDay(today) - startOfDay(target)) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  return target.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function formatTransactionTimestamp(date: string | Date): string {
  const target = new Date(date);
  const today = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const diffDays = Math.round(
    (startOfDay(today) - startOfDay(target)) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) {
    const time = target.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `Hoje, ${time}`;
  }
  if (diffDays === 1) return "1 dia atrás";
  if (diffDays > 1 && diffDays < 30) return `${diffDays} dias atrás`;
  return target.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

const MEMBER_COLORS = [
  "oklch(0.55 0.2 292)",
  "oklch(0.6 0.14 200)",
  "oklch(0.62 0.2 350)",
  "oklch(0.6 0.18 45)",
  "oklch(0.58 0.15 140)",
];

export function getMemberColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length];
}
