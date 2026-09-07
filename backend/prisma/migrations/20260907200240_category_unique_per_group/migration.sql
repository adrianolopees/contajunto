-- DropIndex
DROP INDEX "Category_userId_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Category_userId_groupId_name_key" ON "Category"("userId", "groupId", "name");
