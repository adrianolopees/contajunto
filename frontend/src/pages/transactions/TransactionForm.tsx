import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import toast from "react-hot-toast";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTransaction } from "@/services/transactions";
import { getCategories, type Category } from "@/services/categories";
import { getCards, type Card } from "@/services/cards";
import CategoryPicker, {
  NO_CATEGORY,
} from "@/components/transactions/CategoryPicker";
import PaymentMethodPicker from "@/components/transactions/PaymentMethodPicker";
import CurrencyInput from "@/components/CurrencyInput";

const NO_CARD = "none";
const AMOUNT_CHIPS = [50, 100, 250, 500];

const transactionFormSchema = z.object({
  type: z.enum(["EXPENSE", "INCOME"]),
  amount: z.number().positive("Informe um valor válido"),
  paymentMethod: z.enum(["DEBIT", "CREDIT", "PIX", "CASH"]),
  description: z.string().max(255, "Nota muito longa"),
  categoryId: z.string().optional(),
  cardId: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export default function TransactionForm() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: "EXPENSE",
      amount: 0,
      paymentMethod: "DEBIT",
      description: "",
      categoryId: NO_CATEGORY,
      cardId: NO_CARD,
    },
  });

  const type = useWatch({ control: form.control, name: "type" });
  const paymentMethod = useWatch({
    control: form.control,
    name: "paymentMethod",
  });
  const categoryId = useWatch({ control: form.control, name: "categoryId" });
  const cardId = useWatch({ control: form.control, name: "cardId" });
  const amount = useWatch({ control: form.control, name: "amount" });

  const showCardPicker = type === "EXPENSE" && paymentMethod === "CREDIT";

  // categorias e cartões só precisam ser carregados uma vez
  useEffect(() => {
    async function fetchData() {
      const [categoriesData, cardsData] = await Promise.all([
        getCategories(),
        getCards(),
      ]);
      setCategories(categoriesData);
      setCards(cardsData);
    }
    fetchData();
  }, []);

  // cartão só faz sentido no crédito: fora dele volta pra "nenhum";
  // com um cartão só, seleciona sozinho
  useEffect(() => {
    if (!showCardPicker) {
      if (cardId !== NO_CARD) form.setValue("cardId", NO_CARD);
      return;
    }
    if (cardId === NO_CARD && cards.length === 1) {
      form.setValue("cardId", cards[0].id);
    }
  }, [showCardPicker, cards, cardId, form]);

  // categoria escolhida pode não existir mais pro tipo selecionado — volta pra "sem categoria"
  useEffect(() => {
    if (categoryId === NO_CATEGORY || categories.length === 0) return;
    const stillValid = categories.some(
      (c) => c.id === categoryId && c.type === type,
    );
    if (!stillValid) {
      form.setValue("categoryId", NO_CATEGORY);
    }
  }, [type, categories, categoryId, form]);

  async function onSubmit(data: TransactionFormValues) {
    try {
      const payload = {
        ...data,
        categoryId: data.categoryId === NO_CATEGORY ? undefined : data.categoryId,
        // receita não tem meio de pagamento
        paymentMethod: data.type === "EXPENSE" ? data.paymentMethod : undefined,
        // cartão só no crédito
        cardId:
          data.type === "EXPENSE" &&
          data.paymentMethod === "CREDIT" &&
          data.cardId &&
          data.cardId !== NO_CARD
            ? data.cardId
            : undefined,
      };
      await createTransaction(payload);
      toast.success("Transação criada com sucesso!");
      navigate("/dashboard");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        toast.error("Categoria inválida. Selecione outra.");
      } else {
        toast.error("Erro ao salvar transação. Tente novamente.");
      }
    }
  }

  return (
    <div className="px-4 py-4 md:mx-auto md:max-w-sm">
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Voltar"
          render={<Link to="/transactions" />}
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-lg font-semibold">Novo lançamento</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Toggle Gasto / Ganho */}
        <div className="grid grid-cols-2 gap-2 rounded-xl border p-0.5">
          <button
            type="button"
            onClick={() =>
              form.setValue("type", "EXPENSE", { shouldValidate: true })
            }
            className={cn(
              "rounded-lg py-2 text-sm font-extrabold transition-colors",
              type === "EXPENSE"
                ? "bg-expense text-white"
                : "text-muted-foreground",
            )}
          >
            Gasto
          </button>
          <button
            type="button"
            onClick={() =>
              form.setValue("type", "INCOME", { shouldValidate: true })
            }
            className={cn(
              "rounded-lg py-2 text-sm font-extrabold transition-colors",
              type === "INCOME"
                ? "bg-income text-white"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            Ganho
          </button>
        </div>

        {/* Valor grande + chips de valor rápido */}
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">Valor</p>
          <div className="flex items-center justify-center gap-1">
            <span
              className={cn(
                "text-[42px] font-bold",
                type === "EXPENSE" ? "text-expense" : "text-income",
              )}
            >
              R$
            </span>
            <CurrencyInput
              value={amount}
              onChange={(value) =>
                form.setValue("amount", value, { shouldValidate: true })
              }
              showSymbol={false}
              autoWidth
              className={cn(
                "border-none bg-transparent w-auto py-0 px-2 text-[42px] font-bold shadow-none focus-visible:ring-0",
                type === "EXPENSE" ? "text-expense" : "text-income",
              )}
            />
          </div>
          {form.formState.errors.amount?.message && (
            <p className="text-center text-sm text-destructive">
              {form.formState.errors.amount.message}
            </p>
          )}
          <div className="flex justify-center gap-2">
            {AMOUNT_CHIPS.map((value) => {
              const isSelected = amount === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    form.setValue("amount", value, { shouldValidate: true })
                  }
                  className={cn(
                    "rounded-lg border px-2 py-2 mt-5 bg-muted text-xs transition-colors",
                    isSelected
                      ? type === "EXPENSE"
                        ? "border-expense bg-expense text-white"
                        : "border-income bg-income text-white"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  R$ {value}
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-1">
          <Input
            {...form.register("description")}
            id="description"
            type="text"
            placeholder="Descriçao (opcional)"
            aria-label="Nota"
            className="py-2"
          />
          {form.formState.errors.description?.message && (
            <p className="text-sm text-destructive">
              {form.formState.errors.description.message}
            </p>
          )}
        </div>
        {/* Meio de pagamento: só faz sentido pra gasto */}
        {type === "EXPENSE" && (
          <PaymentMethodPicker
            value={paymentMethod}
            onSelect={(value) =>
              form.setValue("paymentMethod", value, { shouldValidate: true })
            }
          />
        )}

        {/* Cartão: só no crédito */}
        {showCardPicker && (
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              Cartão
            </p>
            {cards.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum cartão cadastrado.{" "}
                <Link to="/me" className="text-primary underline">
                  Cadastrar no perfil
                </Link>
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {cards.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      form.setValue("cardId", c.id, { shouldValidate: true })
                    }
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                      cardId === c.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    form.setValue("cardId", NO_CARD, { shouldValidate: true })
                  }
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm transition-colors",
                    cardId === NO_CARD
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  Nenhum
                </button>
              </div>
            )}
          </div>
        )}

        {/* Categoria: busca + grupos expansíveis */}
        <CategoryPicker
          key={type}
          categories={categories}
          type={type}
          value={categoryId ?? NO_CATEGORY}
          onSelect={(value) =>
            form.setValue("categoryId", value, { shouldValidate: true })
          }
        />

        <div className="flex items-center justify-between gap-2 pb-8">
          <Button
            type="submit"
            className={cn(
              "flex-1 text-white",
              type === "EXPENSE"
                ? "bg-expense hover:bg-expense/90"
                : "bg-income hover:bg-income/90",
            )}
          >
            Salvar lançamento
          </Button>
        </div>
      </form>
    </div>
  );
}
