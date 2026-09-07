import { createHash } from "node:crypto";
import prisma from "./prisma.js";
import { groups } from "./catalogData.js";

export const CATALOG_META_ID = 1;

export interface CatalogSeedResult {
  groups: number;
  categories: number;
  version: number;
  changed: boolean;
}

// Idempotente e seguro pra rodar a cada boot (start:prod): upsert em vez de
// deleteMany+create porque Category.groupId é permanente — apagar um
// CategoryGroup em uso quebraria a FK de quem já herdou o catálogo.
export async function runCatalogSeed(): Promise<CatalogSeedResult> {
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

  // grupo que saiu do catálogo só é removido se nenhum usuário já o tiver
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

  const { version, changed } = await bumpCatalogVersionIfChanged();

  return { groups: groups.length, categories: totalSubcategories, version, changed };
}

// A versão só sobe quando o CONTEÚDO do catálogo muda (hash), então não existe
// número pra lembrar de incrementar. Na criação, começa acima de qualquer
// carimbo já existente em User — senão um usuário carimbado com uma versão
// antiga mais alta nunca sincronizaria.
async function bumpCatalogVersionIfChanged(): Promise<{
  version: number;
  changed: boolean;
}> {
  const contentHash = createHash("sha256")
    .update(JSON.stringify(groups))
    .digest("hex");

  const meta = await prisma.catalogMeta.findUnique({
    where: { id: CATALOG_META_ID },
  });

  if (!meta) {
    const { _max } = await prisma.user.aggregate({
      _max: { categoriesVersion: true },
    });
    const version = (_max.categoriesVersion ?? 0) + 1;
    await prisma.catalogMeta.create({
      data: { id: CATALOG_META_ID, version, contentHash },
    });
    return { version, changed: true };
  }

  if (meta.contentHash === contentHash) {
    return { version: meta.version, changed: false };
  }

  const updated = await prisma.catalogMeta.update({
    where: { id: CATALOG_META_ID },
    data: { version: meta.version + 1, contentHash },
  });
  return { version: updated.version, changed: true };
}
