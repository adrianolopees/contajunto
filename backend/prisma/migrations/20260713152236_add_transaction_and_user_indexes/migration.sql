-- CreateIndex
CREATE INDEX "Transaction_userId_year_month_idx" ON "Transaction"("userId", "year", "month");

-- CreateIndex
CREATE INDEX "Transaction_categoryId_idx" ON "Transaction"("categoryId");

-- CreateIndex
CREATE INDEX "User_familyGroupId_idx" ON "User"("familyGroupId");
