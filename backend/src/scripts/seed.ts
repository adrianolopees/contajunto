import "dotenv/config";
import prisma from "../lib/prisma.js";
import { runCatalogSeed } from "../lib/catalogSeed.js";

// Entry point do seed. Em dev: `npm run seed` (tsx). Em produção: compilado
// pra dist/scripts/seed.js e executado pelo start:prod a cada boot, logo
// depois do `prisma migrate deploy` — código e catálogo sobem juntos.
runCatalogSeed()
  .then((result) => {
    const status = result.changed ? "atualizado" : "sem mudanças";
    console.log(
      `[seed] ${result.groups} grupos, ${result.categories} categorias · catálogo v${result.version} (${status})`,
    );
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
