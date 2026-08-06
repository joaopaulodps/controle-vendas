-- CreateTable
CREATE TABLE "usuarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "marcas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "observacao" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "codigoProduto" TEXT,
    "marca_id" INTEGER,
    "estoque" INTEGER NOT NULL DEFAULT 0,
    "unidade" TEXT NOT NULL DEFAULT 'un',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "produtos_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "marcas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "compras" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fornecedor" TEXT NOT NULL,
    "fornecedor_id" INTEGER,
    "data_compra" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor_total" REAL NOT NULL,
    "observacao" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "compras_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "itens_compra" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "compra_id" INTEGER NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_estimado" REAL NOT NULL,
    "preco_real" REAL NOT NULL,
    CONSTRAINT "itens_compra_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compras" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "itens_compra_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pagamentos_compra" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "compra_id" INTEGER NOT NULL,
    "forma_pagamento" TEXT NOT NULL,
    "parcela" INTEGER NOT NULL DEFAULT 1,
    "valor" REAL NOT NULL,
    "data_vencimento" DATETIME NOT NULL,
    "data_pago" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pagamentos_compra_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compras" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vendas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cliente" TEXT NOT NULL,
    "cliente_id" INTEGER,
    "data_venda" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor_total" REAL NOT NULL,
    "observacao" TEXT,
    "sorteio_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendas_sorteio_id_fkey" FOREIGN KEY ("sorteio_id") REFERENCES "sorteios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "itens_venda" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "venda_id" INTEGER NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_estimado" REAL NOT NULL,
    "preco_real" REAL NOT NULL,
    CONSTRAINT "itens_venda_venda_id_fkey" FOREIGN KEY ("venda_id") REFERENCES "vendas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "itens_venda_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pagamentos_venda" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "venda_id" INTEGER NOT NULL,
    "forma_pagamento" TEXT NOT NULL,
    "parcela" INTEGER NOT NULL DEFAULT 1,
    "valor" REAL NOT NULL,
    "data_vencimento" DATETIME NOT NULL,
    "data_pago" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pagamentos_venda_venda_id_fkey" FOREIGN KEY ("venda_id") REFERENCES "vendas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sorteios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "total_numeros" INTEGER NOT NULL,
    "valor_ingresso" REAL NOT NULL,
    "data_sorteio" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'aberto',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "itens_sorteio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sorteio_id" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "cliente_id" INTEGER,
    "nome_cliente" TEXT NOT NULL DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "itens_sorteio_sorteio_id_fkey" FOREIGN KEY ("sorteio_id") REFERENCES "sorteios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_usuario_key" ON "usuarios"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "itens_sorteio_sorteio_id_numero_key" ON "itens_sorteio"("sorteio_id", "numero");
