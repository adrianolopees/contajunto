-- CreateTable
CREATE TABLE "CategoryGroup" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "CategoryGroup_pkey" PRIMARY KEY ("id")
);

-- Categorias curadas: categorias livres criadas pelo usuário e o catálogo antigo (sem grupo) são substituídos.
-- Transaction.categoryId dessas linhas vira NULL via onDelete: SetNull (dado de dev, sem transações reais a preservar).
DELETE FROM "Category";
DELETE FROM "DefaultCategory";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "groupId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DefaultCategory" ADD COLUMN     "groupId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CategoryGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefaultCategory" ADD CONSTRAINT "DefaultCategory_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CategoryGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
