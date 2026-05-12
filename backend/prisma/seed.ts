import "dotenv/config";
import prisma from "../src/lib/prisma.js";

const defaultCategories = [
  // Despesas
  { name: "Alimentação", color: "#000000", icon: "default" },
  { name: "Moradia", color: "#000000", icon: "default" },
  { name: "Transporte", color: "#000000", icon: "default" },
  { name: "Saúde", color: "#000000", icon: "default" },
  { name: "Educação", color: "#000000", icon: "default" },
  { name: "Lazer", color: "#000000", icon: "default" },
  { name: "Vestuário", color: "#000000", icon: "default" },
  { name: "Assinaturas", color: "#000000", icon: "default" },
  { name: "Beleza", color: "#000000", icon: "default" },
  { name: "Pets", color: "#000000", icon: "default" },
  { name: "Viagens", color: "#000000", icon: "default" },
  { name: "Dívidas", color: "#000000", icon: "default" },
  { name: "Outros", color: "#000000", icon: "default" },
  // Receitas
  { name: "Salário", color: "#000000", icon: "default" },
  { name: "Vale/Adiantamento", color: "#000000", icon: "default" },
  { name: "Freelance", color: "#000000", icon: "default" },
  { name: "Investimentos", color: "#000000", icon: "default" },
  { name: "Outros (Receita)", color: "#000000", icon: "default" },
];

async function main() {
  await prisma.defaultCategory.createMany({
    data: defaultCategories,
    skipDuplicates: true,
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
