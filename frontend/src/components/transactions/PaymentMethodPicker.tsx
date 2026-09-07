import { cn } from "@/lib/utils";
import { PAYMENT_METHODS } from "@/lib/paymentMethods";
import type { PaymentMethod } from "@/services/transactions";

interface PaymentMethodPickerProps {
  value: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

// extraído do TransactionForm quando ganhou um segundo consumidor (edição
// inline em CategoryDetail)
export default function PaymentMethodPicker({
  value,
  onSelect,
}: PaymentMethodPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {PAYMENT_METHODS.map(({ value: method, label, icon: Icon }) => (
        <button
          key={method}
          type="button"
          onClick={() => onSelect(method)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors",
            value === method
              ? "border-primary bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          <Icon size={18} />
          {label}
        </button>
      ))}
    </div>
  );
}
