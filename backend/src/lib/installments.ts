import { clampDay, type YMD } from "./invoice.js";

function addMonths(ymd: YMD, months: number): YMD {
  const totalMonths = ymd.year * 12 + (ymd.month - 1) + months;
  const year = Math.floor(totalMonths / 12);
  const month = (totalMonths % 12) + 1;
  return { year, month, day: clampDay(year, month, ymd.day) };
}

// uma data por parcela, avançando um mês por vez a partir da compra — cada
// parcela cai naturalmente na fatura certa depois, já que buildCardInvoices
// deriva o fechamento a partir da `date` de cada Transaction
export function installmentDates(purchase: YMD, count: number): YMD[] {
  const dates: YMD[] = [];
  for (let i = 0; i < count; i++) {
    dates.push(addMonths(purchase, i));
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
