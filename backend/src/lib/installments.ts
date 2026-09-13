import { clampDay, invoiceCloseMonth, type YMD } from "./invoice.js";

function addMonths(ymd: YMD, months: number): YMD {
  const totalMonths = ymd.year * 12 + (ymd.month - 1) + months;
  const year = Math.floor(totalMonths / 12);
  const month = (totalMonths % 12) + 1;
  return { year, month, day: clampDay(year, month, ymd.day) };
}

// uma data por parcela. Sem cartão (compra parcelada sem fatura pra
// proteger) repete o dia da compra mês a mês — simples, e não tem colisão
// possível porque não existe fatura pra colidir.
//
// Com closingDay, ancora cada parcela na fatura seguinte à anterior (nunca
// repete o dia da compra cegamente): repetir o dia e deixar o clampDay
// encolher em meses mais curtos pode empurrar a parcela pro lado errado do
// fechamento (ex.: fecha dia 29, compra dia 30/jan — fevereiro só tem 28
// dias, o dia clampado fica ≤ 29 e some do mês seguinte, colidindo com a
// parcela anterior). Usar sempre `mín(dia da compra, fechamento do mês
// daquela fatura)` garante que a parcela nunca atravessa o fechamento por
// acidente — ela já nasce do lado certo.
export function installmentDates(
  purchase: YMD,
  count: number,
  closingDay?: number,
): YMD[] {
  if (closingDay == null) {
    const dates: YMD[] = [];
    for (let i = 0; i < count; i++) {
      dates.push(addMonths(purchase, i));
    }
    return dates;
  }

  const firstInvoice = invoiceCloseMonth(purchase, closingDay);
  const dates: YMD[] = [purchase];
  for (let i = 1; i < count; i++) {
    const { year, month } = addMonths(
      { year: firstInvoice.year, month: firstInvoice.month, day: 1 },
      i,
    );
    const closeDayThisMonth = clampDay(year, month, closingDay);
    dates.push({ year, month, day: Math.min(purchase.day, closeDayThisMonth) });
  }
  return dates;
}

// divide o total em `count` parcelas: as N-1 primeiras arredondadas pra
// baixo, a última absorve o resto — garante soma exata sem sobrar centavo,
// mesmo padrão que as operadoras de cartão usam
export function splitAmount(totalCents: number, count: number): number[] {
  const base = Math.floor(totalCents / count);
  const amounts = new Array<number>(count).fill(base);
  amounts[count - 1] = totalCents - base * (count - 1);
  return amounts;
}
