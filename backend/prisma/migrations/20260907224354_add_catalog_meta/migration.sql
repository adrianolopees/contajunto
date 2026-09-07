-- CreateTable
CREATE TABLE "CatalogMeta" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "version" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogMeta_pkey" PRIMARY KEY ("id")
);

-- Linha inicial (singleton). A versão começa ACIMA de qualquer carimbo já
-- existente em User: assim o primeiro seed pós-deploy (que compara o hash,
-- vê '' e bumpa) força um resync idempotente de todo mundo, em vez de deixar
-- quem foi carimbado contra o catálogo antigo marcado como "em dia".
INSERT INTO "CatalogMeta" ("id", "version", "contentHash", "updatedAt")
SELECT 1, COALESCE(MAX("categoriesVersion"), 0) + 1, '', NOW() FROM "User";
