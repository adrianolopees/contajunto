import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className=" flex items-center justify-between py-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrev}
        aria-label="Mês anterior"
      >
        <ChevronLeft />
      </Button>
      <span>
        {new Date(year, month - 1).toLocaleString("pt-BR", { month: "long" })}{" "}
        {year}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        aria-label="Próximo mês"
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
