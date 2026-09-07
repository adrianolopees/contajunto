// `pretest`: semeia o catálogo real no banco de TESTE antes da suíte, pra que
// registro e sync sejam testados contra o mesmo catálogo de produção — e não
// contra o que sobrou lá de outra era (foi assim que o bug do @@unique passou
// por 142 testes verdes). O import de setup.js carrega o .env.test primeiro.
import "../tests/setup.js";
import prisma from "../lib/prisma.js";
import { runCatalogSeed } from "../lib/catalogSeed.js";

runCatalogSeed()
  .then((result) => {
    console.log(
      `[seed:test] ${result.groups} grupos, ${result.categories} categorias · catálogo v${result.version}`,
    );
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
