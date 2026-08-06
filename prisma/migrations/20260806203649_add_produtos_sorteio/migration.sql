-- CreateTable
CREATE TABLE "produtos_sorteio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sorteio_id" INTEGER NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "produtos_sorteio_sorteio_id_fkey" FOREIGN KEY ("sorteio_id") REFERENCES "sorteios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "produtos_sorteio_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "produtos_sorteio_sorteio_id_produto_id_key" ON "produtos_sorteio"("sorteio_id", "produto_id");
