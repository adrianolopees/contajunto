import { useState } from "react";

export function useMonthNavigation() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1); // getMonth() é 0-indexed
  const [year, setYear] = useState(now.getFullYear());

  function prev() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function next() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  return { month, year, prev, next };
}
