interface MonthPickerProps {
  month: number;
  year: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function MonthPicker({
  month,
  year,
  onPrev,
  onNext,
}: MonthPickerProps) {
  return (
    <div className=" flex items-center justify-between  py-2">
      <button onClick={onPrev} aria-label="Mês anterior">
        {"<"}
      </button>
      <span>
        {new Date(year, month - 1).toLocaleString("pt-BR", { month: "long" })}{" "}
        {year}
      </span>
      <button onClick={onNext} aria-label="Próximo mês">
        {">"}
      </button>
    </div>
  );
}
