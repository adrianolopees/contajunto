import { installmentDates, splitAmount } from "../lib/installments.js";

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
