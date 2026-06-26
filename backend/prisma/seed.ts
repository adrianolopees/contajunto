import "dotenv/config";
import prisma from "../src/lib/prisma.js";

const defaultCategories = [
  // Despesas
  { name: "Alimentação", color: "#f97316", icon: "Utensils" },
  { name: "Moradia", color: "#3b82f6", icon: "Home" },
  { name: "Transporte", color: "#0ea5e9", icon: "Car" },
  { name: "Saúde", color: "#ef4444", icon: "HeartPulse" },
  { name: "Educação", color: "#8b5cf6", icon: "BookOpen" },
  { name: "Lazer", color: "#eab308", icon: "Gamepad2" },
  { name: "Vestuário", color: "#ec4899", icon: "Shirt" },
  { name: "Assinaturas", color: "#7c3aed", icon: "RefreshCw" },
  { name: "Beleza", color: "#f43f5e", icon: "Sparkles" },
  { name: "Pets", color: "#f59e0b", icon: "PawPrint" },
  { name: "Viagens", color: "#14b8a6", icon: "Plane" },
  { name: "Dívidas", color: "#6b7280", icon: "CreditCard" },
  { name: "Outros", color: "#94a3b8", icon: "Package" },
  // Receitas
  { name: "Salário", color: "#22c55e", icon: "Banknote" },
  { name: "Vale/Adiantamento", color: "#10b981", icon: "Receipt" },
  { name: "Freelance", color: "#84cc16", icon: "Briefcase" },
  { name: "Investimentos", color: "#06b6d4", icon: "TrendingUp" },
  { name: "Outros (Receita)", color: "#14b8a6", icon: "Plus" },
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
