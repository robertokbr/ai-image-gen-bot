-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chat_id" TEXT NOT NULL,
    "payment_gateway_id" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "is_new" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_Customers" ("chat_id", "created_at", "credits", "id", "payment_gateway_id", "updated_at") SELECT "chat_id", "created_at", "credits", "id", "payment_gateway_id", "updated_at" FROM "Customers";
DROP TABLE "Customers";
ALTER TABLE "new_Customers" RENAME TO "Customers";
CREATE UNIQUE INDEX "Customers_chat_id_key" ON "Customers"("chat_id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
