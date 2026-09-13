import { installmentDates, splitAmount } from "../lib/installments.js";
import { invoiceCloseMonth } from "../lib/invoice.js";

describe("installmentDates", () => {
  it("returns just the purchase date for a single installment", () => {
    expect(installmentDates({ year: 2026, month: 9, day: 13 }, 1)).toEqual([
      { year: 2026, month: 9, day: 13 },
    ]);
  });

  it("advances one month per installment, same day", () => {
    expect(installmentDates({ year: 2026, month: 9, day: 13 }, 3)).toEqual([
      { year: 2026, month: 9, day: 13 },
      { year: 2026, month: 10, day: 13 },
      { year: 2026, month: 11, day: 13 },
    ]);
  });

  it("rolls across the year boundary", () => {
    expect(installmentDates({ year: 2026, month: 11, day: 5 }, 3)).toEqual([
      { year: 2026, month: 11, day: 5 },
      { year: 2026, month: 12, day: 5 },
      { year: 2027, month: 1, day: 5 },
    ]);
  });

  it("clamps day 31 when a later month is shorter", () => {
    // compra em 31/jan: parcela de fevereiro clampa pra 28 (2026 não é bissexto)
    expect(installmentDates({ year: 2026, month: 1, day: 31 }, 2)).toEqual([
      { year: 2026, month: 1, day: 31 },
      { year: 2026, month: 2, day: 28 },
    ]);
  });
});

describe("installmentDates com closingDay (evita colisão de fatura)", () => {
  it("keeps each installment in a distinct, consecutive invoice even when the closing day is near month-end", () => {
    // fecha dia 29, compra 30/jan: repetir o dia (sem closingDay) faria a
    // parcela de fevereiro clampar pra 28, que cai do lado errado do
    // fechamento e colide com a parcela de janeiro na mesma fatura
    const purchase = { year: 2026, month: 1, day: 30 };
    const dates = installmentDates(purchase, 3, 29);

    expect(dates[0]).toEqual(purchase); // a 1ª parcela nunca muda — é a compra real
    const invoices = dates.map((d) => invoiceCloseMonth(d, 29));
    expect(invoices).toEqual([
      { year: 2026, month: 2 },
      { year: 2026, month: 3 },
      { year: 2026, month: 4 },
    ]);
  });

  it("still lands each installment on the same invoice sequence in the common case", () => {
    const purchase = { year: 2026, month: 9, day: 20 };
    const dates = installmentDates(purchase, 3, 15);

    const invoices = dates.map((d) => invoiceCloseMonth(d, 15));
    expect(invoices).toEqual([
      { year: 2026, month: 10 },
      { year: 2026, month: 11 },
      { year: 2026, month: 12 },
    ]);
  });

  it("falls back to repeating the purchase day when closingDay is not given (no card)", () => {
    const withCard = installmentDates({ year: 2026, month: 9, day: 13 }, 3, 15);
    const withoutCard = installmentDates({ year: 2026, month: 9, day: 13 }, 3);
    // sem closingDay não é "o mesmo resultado" por coincidência — é outro
    // branch (fallback ingênuo); só confere que ele continua funcionando
    expect(withoutCard).toEqual([
      { year: 2026, month: 9, day: 13 },
      { year: 2026, month: 10, day: 13 },
      { year: 2026, month: 11, day: 13 },
    ]);
    expect(withCard[0]).toEqual(withoutCard[0]);
  });
});

describe("splitAmount", () => {
  it("returns the whole amount for a single installment", () => {
    expect(splitAmount(15000, 1)).toEqual([15000]);
  });

  it("splits evenly when it divides exactly", () => {
    expect(splitAmount(30000, 3)).toEqual([10000, 10000, 10000]);
  });

  it("puts the rounding remainder on the last installment", () => {
    // R$100,00 em 3x: 33,33 + 33,33 + 33,34
    expect(splitAmount(10000, 3)).toEqual([3333, 3333, 3334]);
  });

  it("sums back to the original total", () => {
    const parts = splitAmount(9999, 7);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(9999);
    expect(parts).toHaveLength(7);
  });
});
