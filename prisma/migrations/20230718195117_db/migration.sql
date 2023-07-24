-- CreateTable
CREATE TABLE "Customers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chat_id" TEXT NOT NULL,
    "payment_gateway_id" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Customers_chat_id_key" ON "Customers"("chat_id");
