import "dotenv/config";
import argon2 from "argon2";
import prisma from "../src/lib/prisma.js";
import { getBusinessMonthYear } from "../src/lib/date.js";
import type { TransactionType } from "../src/generated/prisma/index.js";

// Dados fixos de teste — reexecutável a qualquer momento (apaga e recria só
// essas duas contas, sem tocar em nenhum outro dado do banco)
const GROUP_NAME = "Família Teste";
const TEST_PASSWORD = "teste1234";
const TEST_USERS = [
  { name: "Ana Teste", email: "ana@teste.com", baseSalary: 6200 },
  { name: "Bruno Teste", email: "bruno@teste.com", baseSalary: 4800 },
];
const MONTHS_BACK = 4; // mês atual + 3 anteriores

const LIMITS: Record<string, number> = {
  Supermercado: 600,
  Internet: 100,
  Streaming: 60,
  "Cinema e shows": 150,
};

interface Template {
  category: string;
  descriptions: string[];
  min: number;
  max: number;
}

const EXPENSE_TEMPLATES: Template[] = [
  { category: "Supermercado", descriptions: ["Compras da semana", "Supermercado Extra", "Feira do mês"], min: 80, max: 450 },
  { category: "Padaria", descriptions: ["Pão e leite", "Padaria da esquina"], min: 8, max: 35 },
  { category: "Restaurantes, bares e lanchonetes", descriptions: ["Almoço", "Jantar com amigos", "Happy hour"], min: 25, max: 180 },
  { category: "Delivery de alimentos", descriptions: ["iFood", "Delivery japonês"], min: 30, max: 90 },
  { category: "Internet", descriptions: ["Internet fibra"], min: 90, max: 120 },
  { category: "Eletricidade", descriptions: ["Conta de luz"], min: 120, max: 350 },
  { category: "Água", descriptions: ["Conta de água"], min: 40, max: 90 },
  { category: "Aluguel", descriptions: ["Aluguel do apartamento"], min: 1200, max: 1800 },
  { category: "Estacionamentos", descriptions: ["Estacionamento shopping"], min: 10, max: 40 },
  { category: "Postos de gasolina", descriptions: ["Combustível"], min: 100, max: 250 },
  { category: "Táxi e transporte privado urbano", descriptions: ["Uber", "99"], min: 15, max: 60 },
  { category: "Transporte público", descriptions: ["Recarga bilhete único"], min: 20, max: 60 },
  { category: "Farmácia", descriptions: ["Remédios", "Farmácia"], min: 20, max: 120 },
  { category: "Academia", descriptions: ["Mensalidade academia"], min: 90, max: 150 },
  { category: "Streaming", descriptions: ["Netflix", "Spotify"], min: 20, max: 55 },
  { category: "Cinema e shows", descriptions: ["Cinema", "Show"], min: 40, max: 150 },
  { category: "Viagens", descriptions: ["Passagem", "Hospedagem"], min: 150, max: 900 },
  { category: "Hobbies", descriptions: ["Material de hobby"], min: 30, max: 120 },
  { category: "Compras online", descriptions: ["Compra Shopee", "Compra Amazon"], min: 30, max: 200 },
  { category: "Compras", descriptions: ["Roupas novas"], min: 50, max: 300 },
  { category: "Cursos", descriptions: ["Curso online"], min: 50, max: 250 },
  { category: "Veterinário", descriptions: ["Consulta veterinária"], min: 80, max: 300 },
  { category: "Petshop", descriptions: ["Ração e petiscos"], min: 40, max: 120 },
];

const INCOME_TEMPLATES: Template[] = [
  { category: "Vale e adiantamento", descriptions: ["Vale transporte", "Adiantamento quinzenal"], min: 200, max: 600 },
  { category: "Freelance", descriptions: ["Projeto freelance", "Consultoria"], min: 300, max: 1500 },
  { category: "Vendas", descriptions: ["Venda usado", "Venda OLX"], min: 50, max: 400 },
  { category: "Rendimentos", descriptions: ["Rendimento CDB"], min: 20, max: 200 },
  { category: "Cashback e reembolso", descriptions: ["Cashback cartão"], min: 10, max: 80 },
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAmount(min: number, max: number) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function pick<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function monthsBack(from: Date, count: number) {
  const result: { year: number; month: number }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(from.getFullYear(), from.getMonth() - i, 1);
    result.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return result;
}

function randomDateInMonth(year: number, month: number) {
  const today = new Date();
  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth() + 1;
  const maxDay = isCurrentMonth ? Math.min(28, today.getDate()) : 28;
  const day = randomInt(1, maxDay);
  return new Date(year, month - 1, day, randomInt(8, 21), randomInt(0, 59));
}

interface CategoryLookup {
  id: string;
  name: string;
  type: TransactionType;
}

function buildTransaction(
  userId: string,
  template: Template,
  type: TransactionType,
  categories: CategoryLookup[],
  year: number,
  month: number,
  noCategoryChance: number,
) {
  const category = categories.find((c) => c.name === template.category);
  const date = randomDateInMonth(year, month);
  const { month: businessMonth, year: businessYear } =
    getBusinessMonthYear(date);
  const useCategory = category && Math.random() > noCategoryChance;

  return {
    userId,
    type,
    amount: randomAmount(template.min, template.max),
    description: Math.random() > 0.2 ? pick(template.descriptions) : "",
    categoryId: useCategory ? category!.id : null,
    date,
    month: businessMonth,
    year: businessYear,
  };
}

async function cleanupExisting(emails: string[]) {
  const existing = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true, familyGroupId: true },
  });
  if (existing.length === 0) return;

  const userIds = existing.map((u) => u.id);
  await prisma.transaction.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.category.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });

  const groupIds = [
    ...new Set(existing.map((u) => u.familyGroupId).filter(Boolean)),
  ] as string[];
  for (const groupId of groupIds) {
    const remaining = await prisma.user.count({
      where: { familyGroupId: groupId },
    });
    if (remaining === 0) {
      await prisma.familyGroup.delete({ where: { id: groupId } });
    }
  }
}

async function main() {
  await cleanupExisting(TEST_USERS.map((u) => u.email));

  const defaultCategories = await prisma.defaultCategory.findMany();
  const group = await prisma.familyGroup.create({
    data: { name: GROUP_NAME },
  });

  let totalTransactions = 0;

  for (const testUser of TEST_USERS) {
    const passwordHash = await argon2.hash(TEST_PASSWORD);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: testUser.name,
          email: testUser.email,
          passwordHash,
          familyGroupId: group.id,
        },
      });

      await tx.category.createMany({
        data: defaultCategories.map((cat) => ({
          type: cat.type,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          groupId: cat.groupId,
          userId: newUser.id,
        })),
      });

      return newUser;
    });

    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, type: true },
    });

    for (const [name, monthlyLimit] of Object.entries(LIMITS)) {
      const category = categories.find((c) => c.name === name);
      if (category) {
        await prisma.category.update({
          where: { id: category.id },
          data: { monthlyLimit },
        });
      }
    }

    const transactions: Parameters<
      typeof prisma.transaction.createMany
    >[0]["data"] = [];

    for (const { year, month } of monthsBack(new Date(), MONTHS_BACK)) {
      const salaryDate = new Date(year, month - 1, 5, 9, 0);
      const { month: sMonth, year: sYear } = getBusinessMonthYear(salaryDate);
      transactions.push({
        userId: user.id,
        type: "INCOME",
        amount: randomAmount(
          testUser.baseSalary - 100,
          testUser.baseSalary + 100,
        ),
        description: "Salário mensal",
        categoryId:
          categories.find((c) => c.name === "Salário")?.id ?? null,
        date: salaryDate,
        month: sMonth,
        year: sYear,
      });

      for (const template of INCOME_TEMPLATES) {
        if (Math.random() > 0.5) continue;
        transactions.push(
          buildTransaction(user.id, template, "INCOME", categories, year, month, 0.1),
        );
      }

      const expenseCount = randomInt(18, 25);
      for (let i = 0; i < expenseCount; i++) {
        const template = pick(EXPENSE_TEMPLATES);
        transactions.push(
          buildTransaction(user.id, template, "EXPENSE", categories, year, month, 0.12),
        );
      }
    }

    await prisma.transaction.createMany({ data: transactions });
    totalTransactions += transactions.length;

    console.log(
      `${testUser.name} <${testUser.email}> — ${transactions.length} transações`,
    );
  }

  console.log(
    `\nGrupo "${GROUP_NAME}" com ${TEST_USERS.length} usuários, ${totalTransactions} transações no total.`,
  );
  console.log(`Senha de todos: ${TEST_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
