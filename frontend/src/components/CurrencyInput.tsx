import type { ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";

interface CurrencyInputProps {
  value: number; // reais
  onChange: (value: number) => void;
  className?: string;
  autoFocus?: boolean;
  // esconde o "R$": usado quando quem chama já mostra o símbolo separado
  // (ex: valor grande do TransactionForm, com "R$" num span próprio ao lado)
  showSymbol?: boolean;
  // ajusta o atributo size ao tamanho do texto formatado — pro campo de
  // valor grande do TransactionForm, que cresce/encolhe com o conteúdo
  autoWidth?: boolean;
}

function formatBare(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// input de valor monetário mascarado: dígitos entram sempre pela direita,
// como numa maquininha de cartão — digitar "500" mostra R$ 5,00, não
// R$ 500,00. Elimina a ambiguidade de "quantas casas decimais o usuário
// quis dizer" que existia no campo de texto livre + parseFloat
export default function CurrencyInput({
  value,
  onChange,
  className,
  autoFocus,
  showSymbol = true,
  autoWidth = false,
}: CurrencyInputProps) {
  const display = showSymbol ? formatCurrency(value) : formatBare(value);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    const cents = digits === "" ? 0 : parseInt(digits, 10);
    onChange(cents / 100);
  }

  return (
    <Input
      value={display}
      onChange={handleChange}
      type="text"
      inputMode="numeric"
      autoFocus={autoFocus}
      className={className}
      size={autoWidth ? Math.max(display.length, 4) : undefined}
    />
  );
}
