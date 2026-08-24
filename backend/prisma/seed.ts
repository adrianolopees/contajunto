import "dotenv/config";
import prisma from "../src/lib/prisma.js";
import type { TransactionType } from "../src/generated/prisma/index.js";

interface SubcategorySeed {
  name: string;
  icon: string;
}

interface GroupSeed {
  type: TransactionType;
  name: string;
  color: string;
  icon: string;
  subcategories: SubcategorySeed[];
}

const groups: GroupSeed[] = [
  // Despesas — cada grupo termina com um "Outros" próprio, pra um gasto
  // atípico não sair do total do grupo certo
  {
    type: "EXPENSE",
    name: "Alimentação",
    color: "#f97316",
    icon: "Utensils",
    subcategories: [
      { name: "Supermercado", icon: "ShoppingCart" },
      { name: "Padaria", icon: "Croissant" },
      { name: "Restaurantes, bares e lanchonetes", icon: "Coffee" },
      { name: "Delivery de alimentos", icon: "Bike" },
      { name: "Outros (Alimentação)", icon: "Package" },
    ],
  },
  {
    type: "EXPENSE",
    name: "Finanças",
    color: "#22c55e",
    icon: "Wallet",
    subcategories: [
      { name: "Transferência - PIX", icon: "RefreshCw" },
      { name: "Empréstimos", icon: "HandCoins" },
      { name: "Tarifas bancárias", icon: "Receipt" },
      { name: "Outros (Finanças)", icon: "Package" },
    ],
  },
  {
    type: "EXPENSE",
    name: "Compras",
    color: "#ec4899",
    icon: "Gift",
    subcategories: [
      { name: "Compras online", icon: "Laptop" },
      { name: "Compras", icon: "Shirt" },
      { name: "Papelaria", icon: "BookOpen" },
      { name: "Eletrônicos", icon: "Tv" },
      { name: "Presentes", icon: "Gift" },
      { name: "Outros (Compras)", icon: "Package" },
    ],
  },
  {
    type: "EXPENSE",
    name: "Moradia",
    color: "#3b82f6",
    icon: "Home",
    subcategories: [
      { name: "Internet", icon: "Wifi" },
      { name: "Eletricidade", icon: "Zap" },
      { name: "Água", icon: "Droplet" },
      { name: "Gás", icon: "Flame" },
      { name: "Condomínio", icon: "Building2" },
      { name: "Aluguel", icon: "Key" },
      { name: "Financiamento", icon: "Landmark" },
      { name: "Outros (Moradia)", icon: "Package" },
    ],
  },
  {
    type: "EXPENSE",
    name: "Transporte",
    color: "#f59e0b",
    icon: "Car",
    subcategories: [
      { name: "Estacionamentos", icon: "Wallet" },
      { name: "Postos de gasolina", icon: "Fuel" },
      { name: "Táxi e transporte privado urbano", icon: "Car" },
      { name: "Transporte público", icon: "Bus" },
      { name: "Manutenção do veículo", icon: "Wrench" },
      { name: "Outros (Transporte)", icon: "Package" },
    ],
  },
  {
    type: "EXPENSE",
    name: "Saúde e bem-estar",
    color: "#14b8a6",
    icon: "HeartPulse",
    subcategories: [
      { name: "Farmácia", icon: "Pill" },
      { name: "Bem-estar", icon: "Sparkles" },
      { name: "Saúde", icon: "HeartPulse" },
      { name: "Plano de saúde", icon: "ShieldPlus" },
      { name: "Academia", icon: "Dumbbell" },
      { name: "Outros (Saúde e bem-estar)", icon: "Package" },
    ],
  },
  {
    type: "EXPENSE",
    name: "Serviços digitais",
    color: "#8b5cf6",
    icon: "RefreshCw",
    subcategories: [
      { name: "Streaming", icon: "Tv" },
      { name: "Assinaturas de apps", icon: "AppWindow" },
      { name: "Outros (Serviços digitais)", icon: "Package" },
    ],
  },
  {
    type: "EXPENSE",
    name: "Educação",
    color: "#06b6d4",
    icon: "BookOpen",
    subcategories: [
      { name: "Universidade", icon: "GraduationCap" },
      { name: "Cursos", icon: "BookOpen" },
      { name: "Material escolar", icon: "Pencil" },
      { name: "Outros (Educação)", icon: "Package" },
    ],
  },
  {
    type: "EXPENSE",
    name: "Impostos e taxas",
    color: "#6b7280",
    icon: "Wallet",
    subcategories: [
      { name: "Impostos sobre operações financeiras", icon: "Receipt" },
      { name: "Multas", icon: "AlertTriangle" },
      { name: "Outros (Impostos e taxas)", icon: "Package" },
    ],
  },
  {
    type: "EXPENSE",
    name: "Lazer",
    color: "#eab308",
    icon: "PartyPopper",
    subcategories: [
      { name: "Cinema e shows", icon: "Clapperboard" },
      { name: "Viagens", icon: "Plane" },
      { name: "Hobbies", icon: "Palette" },
      { name: "Outros (Lazer)", icon: "Package" },
    ],
  },
  {
    type: "EXPENSE",
    name: "Pet",
    color: "#78716c",
    icon: "PawPrint",
    subcategories: [
      { name: "Veterinário", icon: "Stethoscope" },
      { name: "Petshop", icon: "Dog" },
      { name: "Outros (Pet)", icon: "Package" },
    ],
  },

  // Receitas
  {
    type: "INCOME",
    name: "Salário",
    color: "#22c55e",
    icon: "Banknote",
    subcategories: [
      { name: "Salário", icon: "Banknote" },
      { name: "Vale e adiantamento", icon: "Receipt" },
    ],
  },
  {
    type: "INCOME",
    name: "Renda extra",
    color: "#84cc16",
    icon: "Briefcase",
    subcategories: [
      { name: "Freelance", icon: "Briefcase" },
      { name: "Vendas", icon: "Package" },
      { name: "Cashback e reembolso", icon: "PiggyBank" },
    ],
  },
  {
    type: "INCOME",
    name: "Investimentos",
    color: "#06b6d4",
    icon: "TrendingUp",
    subcategories: [
      { name: "Rendimentos", icon: "TrendingUp" },
      { name: "Dividendos", icon: "Coins" },
    ],
  },
  {
    type: "INCOME",
    name: "Outros (Receita)",
    color: "#14b8a6",
    icon: "Plus",
    subcategories: [{ name: "Outros", icon: "Plus" }],
  },
];

async function main() {
  // upsert em vez de deleteMany+create: Category.groupId é permanente agora
  // (não existe mais delete de categoria), então apagar um CategoryGroup em
  // uso quebraria a FK de quem já herdou o catálogo no registro
  let totalSubcategories = 0;

  for (const group of groups) {
    const categoryGroup = await prisma.categoryGroup.upsert({
      where: { name: group.name },
      update: { type: group.type, color: group.color, icon: group.icon },
      create: {
        type: group.type,
        name: group.name,
        color: group.color,
        icon: group.icon,
      },
    });

    await prisma.defaultCategory.deleteMany({
      where: {
        groupId: categoryGroup.id,
        name: { notIn: group.subcategories.map((sub) => sub.name) },
      },
    });

    for (const sub of group.subcategories) {
      await prisma.defaultCategory.upsert({
        where: { groupId_name: { groupId: categoryGroup.id, name: sub.name } },
        update: { type: group.type, color: group.color, icon: sub.icon },
        create: {
          type: group.type,
          name: sub.name,
          color: group.color,
          icon: sub.icon,
          groupId: categoryGroup.id,
        },
      });
    }
    totalSubcategories += group.subcategories.length;
  }

  // grupo que saiu do catálogo (ex: "Outros" avulso substituído pelos
  // "Outros" por grupo pai) só é removido se nenhum usuário já o tiver
  const currentNames = groups.map((g) => g.name);
  const staleGroups = await prisma.categoryGroup.findMany({
    where: { name: { notIn: currentNames } },
    include: { _count: { select: { categories: true } } },
  });
  for (const stale of staleGroups) {
    if (stale._count.categories === 0) {
      await prisma.defaultCategory.deleteMany({ where: { groupId: stale.id } });
      await prisma.categoryGroup.delete({ where: { id: stale.id } });
    } else {
      console.warn(
        `Grupo "${stale.name}" saiu do catálogo mas ${stale._count.categories} usuário(s) já o possuem — mantido.`,
      );
    }
  }

  console.log(
    `${groups.length} grupos e ${totalSubcategories} categorias padrão sincronizadas.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
