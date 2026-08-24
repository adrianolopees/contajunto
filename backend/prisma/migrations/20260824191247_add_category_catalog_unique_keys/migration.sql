/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `CategoryGroup` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[groupId,name]` on the table `DefaultCategory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CategoryGroup_name_key" ON "CategoryGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DefaultCategory_groupId_name_key" ON "DefaultCategory"("groupId", "name");
