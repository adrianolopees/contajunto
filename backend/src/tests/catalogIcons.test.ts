import { readFileSync } from "node:fs";
import path from "node:path";
import { groups } from "../lib/catalogData.js";

// O frontend renderiza ícones por nome (string vinda do banco) a partir de um
// mapa fechado em frontend/src/lib/categoryIcons.ts. Este teste fecha o ciclo:
// um ícone novo no catálogo sem entrada no mapa cairia no fallback (Circle) em
// produção sem ninguém perceber. Lê o arquivo como texto de propósito — os
// dois projetos não compartilham módulos, só o repositório.
describe("catalog icons", () => {
  const mapSource = readFileSync(
    path.resolve(process.cwd(), "../frontend/src/lib/categoryIcons.ts"),
    "utf8",
  );
  const mapBody = mapSource.slice(mapSource.indexOf("CATEGORY_ICONS"));
  const mappedIcons = new Set(
    [...mapBody.matchAll(/^\s{2}([A-Z][A-Za-z0-9]*),$/gm)].map((m) => m[1]),
  );

  const catalogIcons = new Set<string>();
  for (const group of groups) {
    catalogIcons.add(group.icon);
    for (const sub of group.subcategories) catalogIcons.add(sub.icon);
  }

  it("should have every catalog icon present in the frontend icon map", () => {
    const missing = [...catalogIcons].filter((icon) => !mappedIcons.has(icon));
    expect(missing).toEqual([]);
  });

  it("should keep the frontend fallback icon in the map", () => {
    expect(mappedIcons.has("Circle")).toBe(true);
  });
});
