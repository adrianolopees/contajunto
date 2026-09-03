import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import axios from "axios";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  createCard,
  deleteCard,
  getCards,
  updateCard,
  type Card,
} from "@/services/cards";

const CARD_COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#22c55e",
  "#f97316",
  "#ec4899",
  "#6b7280",
];

const dayField = z
  .string()
  .refine((v) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= 1 && n <= 31;
  }, "Dia entre 1 e 31");

const cardFormSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(50, "Máximo 50"),
  closingDay: dayField,
  dueDay: dayField,
  color: z.string(),
});

type CardFormValues = z.infer<typeof cardFormSchema>;

export default function CardManager() {
  const [cards, setCards] = useState<Card[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Card | null>(null);
  const [deleting, setDeleting] = useState<Card | null>(null);

  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      name: "",
      closingDay: "",
      dueDay: "",
      color: CARD_COLORS[0],
    },
  });
  const selectedColor = useWatch({ control: form.control, name: "color" });

  useEffect(() => {
    getCards().then(setCards).catch(() => {
      toast.error("Não foi possível carregar os cartões.");
    });
  }, []);

  function openNew() {
    setEditing(null);
    form.reset({
      name: "",
      closingDay: "",
      dueDay: "",
      color: CARD_COLORS[0],
    });
    setFormOpen(true);
  }

  function openEdit(card: Card) {
    setEditing(card);
    form.reset({
      name: card.name,
      closingDay: String(card.closingDay),
      dueDay: String(card.dueDay),
      color: card.color,
    });
    setFormOpen(true);
  }

  async function onSubmit(data: CardFormValues) {
    const payload = {
      name: data.name,
      closingDay: Number(data.closingDay),
      dueDay: Number(data.dueDay),
      color: data.color,
    };
    try {
      if (editing) {
        const updated = await updateCard(editing.id, payload);
        setCards((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c)),
        );
        toast.success("Cartão atualizado!");
      } else {
        const created = await createCard(payload);
        setCards((prev) => [...prev, created]);
        toast.success("Cartão adicionado!");
      }
      setFormOpen(false);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error("Limite de 5 cartões atingido.");
      } else {
        toast.error("Erro ao salvar o cartão. Tente novamente.");
      }
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteCard(deleting.id);
      setCards((prev) => prev.filter((c) => c.id !== deleting.id));
      toast.success("Cartão removido.");
    } catch {
      toast.error("Erro ao remover o cartão. Tente novamente.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Cartões de crédito</Label>
        {cards.length < 5 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openNew}
          >
            <Plus size={16} /> Adicionar
          </Button>
        )}
      </div>

      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum cartão. Adicione um para acompanhar as faturas.
        </p>
      ) : (
        <ul className="space-y-2">
          {cards.map((card) => (
            <li
              key={card.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <span
                className="size-4 shrink-0 rounded-full"
                style={{ backgroundColor: card.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{card.name}</p>
                <p className="text-xs text-muted-foreground">
                  Fecha dia {card.closingDay} · vence dia {card.dueDay}
                </p>
              </div>
              <button
                type="button"
                aria-label="Editar cartão"
                onClick={() => openEdit(card)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                aria-label="Excluir cartão"
                onClick={() => setDeleting(card)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar cartão" : "Novo cartão"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="card-name">Nome</Label>
              <Input
                {...form.register("name")}
                id="card-name"
                placeholder="Nubank, Inter…"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="card-closing">Dia de fechamento</Label>
                <Input
                  {...form.register("closingDay")}
                  id="card-closing"
                  type="text"
                  inputMode="numeric"
                  placeholder="3"
                />
                {form.formState.errors.closingDay && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.closingDay.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="card-due">Dia de vencimento</Label>
                <Input
                  {...form.register("dueDay")}
                  id="card-due"
                  type="text"
                  inputMode="numeric"
                  placeholder="10"
                />
                {form.formState.errors.dueDay && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.dueDay.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Cor</Label>
              <div className="flex gap-2">
                {CARD_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Cor ${color}`}
                    onClick={() => form.setValue("color", color)}
                    className={cn(
                      "size-7 rounded-full border-2 transition-transform",
                      selectedColor === color
                        ? "scale-110 border-foreground"
                        : "border-transparent",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir cartão?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Os lançamentos feitos nesse cartão continuam, mas deixam de ficar
            ligados a ele.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleting(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
