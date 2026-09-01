// O `tsc` só compila .ts — o Prisma Client gerado (src/generated/) é .js +
// .wasm + .d.ts + binários, então não entra no dist/ sozinho. Sem isto,
// `node dist/server.js` quebra com ERR_MODULE_NOT_FOUND em produção.
import { cpSync, existsSync } from "node:fs";

const from = "src/generated";
const to = "dist/generated";

if (!existsSync(from)) {
  console.error(`[copy-generated] ${from} não existe — rode "prisma generate" antes.`);
  process.exit(1);
}

cpSync(from, to, { recursive: true });
console.log(`[copy-generated] ${from} -> ${to}`);
