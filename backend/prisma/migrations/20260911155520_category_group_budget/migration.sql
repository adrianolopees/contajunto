-- AlterTable
ALTER TABLE "User" DROP COLUMN "monthlyBudget";

-- CreateTable
CREATE TABLE "CategoryGroupBudget" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryGroupBudget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryGroupBudget_userId_groupId_key" ON "CategoryGroupBudget"("userId", "groupId");

-- AddForeignKey
ALTER TABLE "CategoryGroupBudget" ADD CONSTRAINT "CategoryGroupBudget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryGroupBudget" ADD CONSTRAINT "CategoryGroupBudget_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CategoryGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
