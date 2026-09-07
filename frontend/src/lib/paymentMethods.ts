import {
  Banknote,
  CreditCard,
  Landmark,
  QrCode,
  type LucideIcon,
} from "lucide-react";
import type { PaymentMethod } from "@/services/transactions";

export const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "DEBIT", label: "Débito", icon: Landmark },
  { value: "CREDIT", label: "Crédito", icon: CreditCard },
  { value: "PIX", label: "Pix", icon: QrCode },
  { value: "CASH", label: "Dinheiro", icon: Banknote },
];
