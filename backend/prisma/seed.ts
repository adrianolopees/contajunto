import "dotenv/config";
import prisma from "../src/lib/prisma.js";
import type { Prisma } from "../src/generated/prisma/index.js";

const defaultCategories: Prisma.DefaultCategoryCreateManyInput[] = [
  // Despesas
  { type: "EXPENSE", name: "Alimentação", color: "#f97316", icon: "Utensils" },
  { type: "EXPENSE", name: "Moradia", color: "#3b82f6", icon: "Home" },
  { type: "EXPENSE", name: "Transporte", color: "#0ea5e9", icon: "Car" },
  { type: "EXPENSE", name: "Saúde", color: "#ef4444", icon: "HeartPulse" },
  { type: "EXPENSE", name: "Educação", color: "#8b5cf6", icon: "BookOpen" },
  { type: "EXPENSE", name: "Lazer", color: "#eab308", icon: "Gamepad2" },
  { type: "EXPENSE", name: "Vestuário", color: "#ec4899", icon: "Shirt" },
  { type: "EXPENSE", name: "Assinaturas", color: "#7c3aed", icon: "RefreshCw" },
  { type: "EXPENSE", name: "Beleza", color: "#f43f5e", icon: "Sparkles" },
  { type: "EXPENSE", name: "Pets", color: "#f59e0b", icon: "PawPrint" },
  { type: "EXPENSE", name: "Viagens", color: "#14b8a6", icon: "Plane" },
  { type: "EXPENSE", name: "Dívidas", color: "#6b7280", icon: "CreditCard" },
  { type: "EXPENSE", name: "Outros", color: "#94a3b8", icon: "Package" },

  // Receitas
  { type: "INCOME", name: "Salário", color: "#22c55e", icon: "Banknote" },
  {
    type: "INCOME",
    name: "Vale/Adiantamento",
    color: "#10b981",
    icon: "Receipt",
  },
  { type: "INCOME", name: "Freelance", color: "#84cc16", icon: "Briefcase" },
  {
    type: "INCOME",
    name: "Investimentos",
    color: "#06b6d4",
    icon: "TrendingUp",
  },
  { type: "INCOME", name: "Outros (Receita)", color: "#14b8a6", icon: "Plus" },
];

async function main() {
  await prisma.defaultCategory.deleteMany({});
  await prisma.defaultCategory.createMany({
    data: defaultCategories,
  });

  console.log(`${defaultCategories.length} categorias padrão inseridas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
