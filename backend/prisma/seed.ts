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
      { name: "Feira e hortifruti", icon: "Carrot" },
      { name: "Açougue", icon: "Beef" },
      { name: "Padaria", icon: "Croissant" },
      { name: "Restaurantes, bares e lanchonetes", icon: "Coffee" },
      { name: "Delivery de alimentos", icon: "Bike" },
      { name: "Marmita/refeição no trabalho", icon: "Sandwich" },
      { name: "Outros", icon: "Package" },
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
      { name: "Cartão de crédito (fatura/anuidade)", icon: "CreditCard" },
      { name: "Juros e multas de atraso", icon: "AlertCircle" },
      { name: "Tarifas bancárias", icon: "Receipt" },
      { name: "Câmbio/IOF de viagem", icon: "ArrowLeftRight" },
      { name: "Outros", icon: "Package" },
    ],
  },
  {
    type: "EXPENSE",
    name: "Compras",
    color: "#ec4899",
    icon: "Gift",
    subcategories: [
      { name: "Compras online", icon: "Laptop" },
      { name: "Compras", icon: "ShoppingBag" },
      { name: "Papelaria", icon: "BookOpen" },
      { name: "Eletrônicos", icon: "Tv" },
      { name: "Móveis e decoração", icon: "Sofa" },
      { name: "Presentes", icon: "Gift" },
      { name: "Outros", icon: "Package" },
    ],
  },
  {
    type: "EXPENSE",
    name: "Vestuário e Moda",
    color: "#d946ef",
    icon: "Shirt",
    subcategories: [
      { name: "Roupas", icon: "Shirt" },
      { name: "Calçados", icon: "Footprints" },
      { name: "Acessórios", icon: "Watch" },
      { name: "Outros", icon: "Package" },
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
      { name: "Manutenção e reparos", icon: "Hammer" },
      { name: "Diarista/faxina", icon: "SprayCan" },
      { name: "IPTU", icon: "Receipt" },
      { name: "Outros", icon: "Package" },
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
      { name: "Uber/99", icon: "Car" },
      { name: "Táxi", icon: "Car" },
      { name: "Transporte público", icon: "Bus" },
      { name: "Pedágio", icon: "Ticket" },
      { name: "Manutenção do veículo", icon: "Wrench" },
      { name: "IPVA/licenciamento", icon: "FileText" },
      { name: "Outros", icon: "Package" },
    ],
  },
  {
    type: "EXPENSE",
    name: "Saúde e bem-estar",
    color: "#14b8a6",
    icon: "HeartPulse",
    subcategories: [
      { name: "Farmácia", icon: "Pill" },
      { name: "Consultas e exames", icon: "Stethoscope" },
      { name: "Odontologia", icon: "Smile" },
      { name: "Terapia/psicologia", icon: "Brain" },
      { name: "Bem-estar", icon: "Sparkles" },
      { name: "Óculos e lentes", icon: "Glasses" },
      { name: "Plano de saúde", icon: "ShieldPlus" },
      { name: "Academia", icon: "Dumbbell" },
      { name: "Outros", icon: "Package" },
    ],
  },
  {
    type: "EXPENSE",
    name: "Cuidados pessoais e beleza",
    color: "#fb7185",
    icon: "Sparkles",
    subcategories: [
      { name: "Cabelo e estética", icon: "Scissors" },
      { name: "Cosméticos", icon: "Sparkles" },
      { name: "Barbearia/salão", icon: "Scissors" },
      { name: "Outros", icon: "Package" },
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
      { name: "Armazenamento em nuvem", icon: "Cloud" },
      { name: "Software/ferramentas de trabalho", icon: "Terminal" },
      { name: "Outros", icon: "Package" },
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
      { name: "Livros", icon: "Book" },
      { name: "Idiomas", icon: "Languages" },
      { name: "Material escolar", icon: "Pencil" },
      { name: "Outros", icon: "Package" },
    ],
  },
  {
    type: "EXPENSE",
    name: "Impostos e taxas",
    color: "#6b7280",
    icon: "Wallet",
    subcategories: [
      { name: "Impostos sobre operações financeiras", icon: "Receipt" },
      { name: "IR (imposto de renda)", icon: "FileText" },
      { name: "Cartório e documentação", icon: "Stamp" },
      { name: "Multas", icon: "AlertTriangle" },
      { name: "Outros", icon: "Package" },
    ],
  },
  {
    type: "EXPENSE",
    name: "Lazer",
    color: "#eab308",
    icon: "PartyPopper",
    subcategories: [
      { name: "Cinema e shows", icon: "Clapperboard" },
      { name: "Bares e baladas", icon: "Beer" },
      { name: "Jogos e entretenimento digital", icon: "Gamepad2" },
      { name: "Hobbies", icon: "Palette" },
      { name: "Outros", icon: "Package" },
    ],
  },
  {
    type: "EXPENSE",
    name: "Viagem",
    color: "#0284c7",
    icon: "Plane",
    subcategories: [
      { name: "Passagens", icon: "Plane" },
      { name: "Hospedagem", icon: "BedDouble" },
      { name: "Passeios e turismo", icon: "MapPin" },
      { name: "Câmbio e taxas de viagem", icon: "ArrowLeftRight" },
      { name: "Outros", icon: "Package" },
    ],
  },
  {
    type: "EXPENSE",
    name: "Família e filhos",
    color: "#f472b6",
    icon: "Users",
    subcategories: [
      { name: "Creche/escola", icon: "School" },
      { name: "Mensalidade escolar", icon: "GraduationCap" },
      { name: "Babá/cuidador", icon: "UserCheck" },
      { name: "Brinquedos", icon: "ToyBrick" },
      { name: "Mesada", icon: "PiggyBank" },
      { name: "Roupas infantis", icon: "Baby" },
      { name: "Outros", icon: "Package" },
    ],
  },
  {
    type: "EXPENSE",
    name: "Seguros",
    color: "#0ea5e9",
    icon: "ShieldCheck",
    subcategories: [
      { name: "Seguro de vida", icon: "HeartHandshake" },
      { name: "Seguro residencial", icon: "Home" },
      { name: "Seguro veicular", icon: "Car" },
      { name: "Seguro saúde", icon: "ShieldPlus" },
      { name: "Outros", icon: "Package" },
    ],
  },
  {
    type: "EXPENSE",
    name: "Doações e contribuições",
    color: "#a3a3a3",
    icon: "HandHeart",
    subcategories: [
      { name: "Doações", icon: "HandHeart" },
      { name: "Dízimo/contribuição religiosa", icon: "Church" },
      { name: "Vaquinhas", icon: "Users" },
      { name: "Outros", icon: "Package" },
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
      { name: "Ração", icon: "Bone" },
      { name: "Vacinas e medicamentos", icon: "Syringe" },
      { name: "Outros", icon: "Package" },
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
