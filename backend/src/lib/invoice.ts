export interface YMD {
  year: number;
  month: number; // 1-12
  day: number;
}

export function clampDay(year: number, month: number, day: number): number {
  const lastDay = new Date(year, month, 0).getDate();
  return Math.min(day, lastDay);
}

function nextMonth(year: number, month: number): { year: number; month: number } {
  return month === 12
    ? { year: year + 1, month: 1 }
    : { year, month: month + 1 };
}

// A compra cai na primeira fatura que fecha em closingDay >= data da compra
// (fechamento inclusivo). Retorna o ano/mês em que essa fatura fecha.
export function invoiceCloseMonth(
  purchase: YMD,
  closingDay: number,
): { year: number; month: number } {
  const closeDayThisMonth = clampDay(purchase.year, purchase.month, closingDay);
  if (purchase.day <= closeDayThisMonth) {
    return { year: purchase.year, month: purchase.month };
  }
  return nextMonth(purchase.year, purchase.month);
}

export function invoiceCloseDate(
  closeYear: number,
  closeMonth: number,
  closingDay: number,
): YMD {
  return {
    year: closeYear,
    month: closeMonth,
    day: clampDay(closeYear, closeMonth, closingDay),
  };
}

// Vence no mês do fechamento se dueDay > closingDay; senão no mês seguinte.
export function invoiceDueDate(
  closeYear: number,
  closeMonth: number,
  closingDay: number,
  dueDay: number,
): YMD {
  if (dueDay > closingDay) {
    return {
      year: closeYear,
      month: closeMonth,
      day: clampDay(closeYear, closeMonth, dueDay),
    };
  }
  const due = nextMonth(closeYear, closeMonth);
  return {
    year: due.year,
    month: due.month,
    day: clampDay(due.year, due.month, dueDay),
  };
}

export function compareYMD(a: YMD, b: YMD): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

export function ymdToISO(d: YMD): string {
  const mm = String(d.month).padStart(2, "0");
  const dd = String(d.day).padStart(2, "0");
  return `${d.year}-${mm}-${dd}`;
}

export interface InvoiceInput {
  amountCents: number;
  purchase: YMD;
}

export interface InvoiceShape {
  closeDate: string;
  dueDate: string;
  total: number;
  count: number;
  closed: boolean;
}

// Agrupa as compras de crédito de um cartão por fatura e devolve a fatura
// "atual" (última já fechada, ou a primeira se nenhuma fechou) e a "próxima"
// (primeira ainda aberta). Sem histórico — faturas antigas ficam de fora até
// a Slice 3 rastrear pagamento.
export function buildCardInvoices(
  txs: InvoiceInput[],
  closingDay: number,
  dueDay: number,
  today: YMD,
): { current: InvoiceShape | null; upcoming: InvoiceShape | null } {
  if (txs.length === 0) return { current: null, upcoming: null };

  const buckets = new Map<
    string,
    { year: number; month: number; totalCents: number; count: number }
  >();
  for (const tx of txs) {
    const close = invoiceCloseMonth(tx.purchase, closingDay);
    const key = `${close.year}-${close.month}`;
    const entry = buckets.get(key) ?? {
      year: close.year,
      month: close.month,
      totalCents: 0,
      count: 0,
    };
    entry.totalCents += tx.amountCents;
    entry.count += 1;
    buckets.set(key, entry);
  }

  const shape = (b: {
    year: number;
    month: number;
    totalCents: number;
    count: number;
  }): InvoiceShape => {
    const closeDate = invoiceCloseDate(b.year, b.month, closingDay);
    return {
      closeDate: ymdToISO(closeDate),
      dueDate: ymdToISO(invoiceDueDate(b.year, b.month, closingDay, dueDay)),
      total: b.totalCents / 100,
      count: b.count,
      closed: compareYMD(closeDate, today) < 0,
    };
  };

  const sorted = [...buckets.values()].sort((a, b) =>
    compareYMD(
      invoiceCloseDate(a.year, a.month, closingDay),
      invoiceCloseDate(b.year, b.month, closingDay),
    ),
  );

  const closed = sorted.filter(
    (b) =>
      compareYMD(invoiceCloseDate(b.year, b.month, closingDay), today) < 0,
  );
  const current = closed.length > 0 ? shape(closed[closed.length - 1]) : shape(sorted[0]);

  const upcomingBucket = sorted.find(
    (b) =>
      compareYMD(invoiceCloseDate(b.year, b.month, closingDay), today) >= 0 &&
      ymdToISO(invoiceCloseDate(b.year, b.month, closingDay)) !== current.closeDate,
  );

  return { current, upcoming: upcomingBucket ? shape(upcomingBucket) : null };
}
