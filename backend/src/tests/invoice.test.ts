import {
  clampDay,
  invoiceCloseMonth,
  invoiceDueDate,
  buildCardInvoices,
} from "../lib/invoice.js";

describe("clampDay", () => {
  it("clamps day 31 to the last day of February", () => {
    expect(clampDay(2026, 2, 31)).toBe(28);
  });

  it("keeps day 29 in a leap February", () => {
    expect(clampDay(2024, 2, 30)).toBe(29);
  });

  it("leaves a valid day untouched", () => {
    expect(clampDay(2026, 1, 15)).toBe(15);
  });
});

describe("invoiceCloseMonth", () => {
  it("keeps a purchase on or before the closing day in the same month", () => {
    expect(invoiceCloseMonth({ year: 2026, month: 8, day: 2 }, 3)).toEqual({
      year: 2026,
      month: 8,
    });
    expect(invoiceCloseMonth({ year: 2026, month: 8, day: 3 }, 3)).toEqual({
      year: 2026,
      month: 8,
    });
  });

  it("rolls a purchase after the closing day to the next month", () => {
    expect(invoiceCloseMonth({ year: 2026, month: 8, day: 5 }, 3)).toEqual({
      year: 2026,
      month: 9,
    });
  });

  it("rolls across the year boundary", () => {
    expect(invoiceCloseMonth({ year: 2026, month: 12, day: 20 }, 5)).toEqual({
      year: 2027,
      month: 1,
    });
  });
});

describe("invoiceDueDate", () => {
  it("uses the close month when dueDay is after closingDay", () => {
    expect(invoiceDueDate(2026, 8, 3, 10)).toEqual({
      year: 2026,
      month: 8,
      day: 10,
    });
  });

  it("uses the next month when dueDay is not after closingDay", () => {
    expect(invoiceDueDate(2026, 8, 25, 5)).toEqual({
      year: 2026,
      month: 9,
      day: 5,
    });
  });

  it("clamps the due day to the month length", () => {
    expect(invoiceDueDate(2026, 2, 5, 31)).toEqual({
      year: 2026,
      month: 2,
      day: 28,
    });
  });
});

describe("buildCardInvoices", () => {
  it("returns nulls when there are no transactions", () => {
    expect(buildCardInvoices([], 3, 10, { year: 2026, month: 9, day: 3 }))
      .toEqual({ current: null, upcoming: null });
  });

  it("marks an already closed invoice and totals it in cents", () => {
    const { current } = buildCardInvoices(
      [
        { amountCents: 10050, purchase: { year: 2026, month: 7, day: 10 } },
        { amountCents: 4900, purchase: { year: 2026, month: 7, day: 20 } },
      ],
      3,
      10,
      { year: 2026, month: 9, day: 15 },
    );
    // ambas fecham em 03/ago, que já passou em 15/set
    expect(current).toMatchObject({
      closeDate: "2026-08-03",
      dueDate: "2026-08-10",
      total: 149.5,
      count: 2,
      closed: true,
    });
  });

  it("separates the current (closed) invoice from the upcoming one", () => {
    const result = buildCardInvoices(
      [
        { amountCents: 20000, purchase: { year: 2026, month: 7, day: 15 } },
        { amountCents: 5000, purchase: { year: 2026, month: 8, day: 15 } },
      ],
      3,
      10,
      { year: 2026, month: 8, day: 20 },
    );
    expect(result.current).toMatchObject({
      closeDate: "2026-08-03",
      total: 200,
      closed: true,
    });
    expect(result.upcoming).toMatchObject({
      closeDate: "2026-09-03",
      total: 50,
      closed: false,
    });
  });
});
