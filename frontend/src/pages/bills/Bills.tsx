import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { getBills, payBill, type Bill, type Invoice } from "@/services/cards";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

function todayISO() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${mm}-${dd}`;
}

function parseISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDay(iso: string) {
  return parseISODate(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function daysUntil(iso: string) {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  return Math.round((parseISODate(iso).getTime() - startOfToday) / 86_400_000);
}

function dueLabel(iso: string) {
  const d = daysUntil(iso);
  if (d < 0) return { text: `venceu há ${-d} ${-d === 1 ? "dia" : "dias"}`, late: true };
  if (d === 0) return { text: "vence hoje", late: true };
  if (d === 1) return { text: "vence amanhã", late: false };
  return { text: `vence em ${d} dias`, late: false };
}

function InvoiceRow({
  label,
  invoice,
}: {
  label: string;
  invoice: Invoice;
}) {
  const due = dueLabel(invoice.dueDate);
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-sm font-medium">
          {label}
          {invoice.paid && (
            <CheckCircle2 size={14} className="shrink-0 text-income" />
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {invoice.paid ? (
            "paga"
          ) : invoice.closed ? (
            <span className={cn(due.late && "text-expense")}>{due.text}</span>
          ) : (
            `fecha ${formatDay(invoice.closeDate)}`
          )}
          {" · "}
          {invoice.count} {invoice.count === 1 ? "compra" : "compras"}
        </p>
      </div>
      <p className="shrink-0 font-semibold">{formatCurrency(invoice.total)}</p>
    </div>
  );
}

function BillCard({
  bill,
  onPay,
}: {
  bill: Bill;
  onPay: (bill: Bill) => void;
}) {
  const canPay = bill.current.closed && !bill.current.paid;
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <span
            className="size-3 rounded-full"
            style={{ backgroundColor: bill.card.color }}
          />
          <p className="font-semibold">{bill.card.name}</p>
        </div>
        <InvoiceRow
          label={bill.current.closed ? "Fatura fechada" : "Fatura atual"}
          invoice={bill.current}
        />
        {canPay && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onPay(bill)}
          >
            Registrar pagamento
          </Button>
        )}
        {bill.upcoming && (
          <>
            <div className="border-t" />
            <InvoiceRow label="Próxima" invoice={bill.upcoming} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Bills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [totalDue, setTotalDue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  const [paidOn, setPaidOn] = useState(todayISO());
  const [isPaying, setIsPaying] = useState(false);

  function loadBills() {
    return getBills()
      .then((data) => {
        setBills(data.bills);
        setTotalDue(data.totalDue);
      })
      .catch(() => toast.error("Não foi possível carregar as faturas."));
  }

  useEffect(() => {
    loadBills().finally(() => setIsLoading(false));
  }, []);

  function openPay(bill: Bill) {
    setPayingBill(bill);
    setPaidOn(todayISO());
  }

  async function confirmPay() {
    if (!payingBill) return;
    setIsPaying(true);
    try {
      await payBill(payingBill.card.id, paidOn);
      toast.success("Fatura marcada como paga!");
      setPayingBill(null);
      await loadBills();
    } catch {
      toast.error("Não foi possível registrar o pagamento.");
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <div className="space-y-4 px-4 py-4 pb-24">
      <h1 className="text-xl font-semibold">Contas a pagar</h1>

      {isLoading ? (
        <p className="py-8 text-center text-muted-foreground">Carregando...</p>
      ) : bills.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
          <CreditCard className="size-8" />
          <p>
            Nenhuma fatura em aberto. Compras no crédito com cartão aparecem
            aqui.
          </p>
          <Link to="/me" className="text-sm text-primary underline">
            Gerenciar cartões
          </Link>
        </div>
      ) : (
        <>
          {totalDue > 0 && (
            <Card className="border-none bg-primary text-primary-foreground">
              <CardContent>
                <p className="text-sm opacity-80">Total a pagar</p>
                <p className="text-3xl font-extrabold">
                  {formatCurrency(totalDue)}
                </p>
              </CardContent>
            </Card>
          )}
          <div className="space-y-3">
            {bills.map((bill) => (
              <BillCard key={bill.card.id} bill={bill} onPay={openPay} />
            ))}
          </div>
        </>
      )}

      <Dialog
        open={payingBill !== null}
        onOpenChange={(open) => !open && setPayingBill(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pagamento</DialogTitle>
          </DialogHeader>
          {payingBill && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  {payingBill.card.name} · fatura fechada
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(payingBill.current.total)}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paid-on">Data do pagamento</Label>
                <Input
                  id="paid-on"
                  type="date"
                  value={paidOn}
                  onChange={(e) => setPaidOn(e.target.value)}
                  max={todayISO()}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPayingBill(null)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={confirmPay} disabled={isPaying}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
