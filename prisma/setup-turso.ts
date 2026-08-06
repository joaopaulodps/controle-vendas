require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const { createClient } = require('@libsql/client')
const bcrypt = require('bcryptjs')

const tursoUrl = process.env.TURSO_DATABASE_URL
const tursoToken = process.env.TURSO_AUTH_TOKEN

if (!tursoUrl || !tursoToken) {
  console.error('Defina TURSO_DATABASE_URL e TURSO_AUTH_TOKEN')
  process.exit(1)
}

const client = createClient({ url: tursoUrl, authToken: tursoToken })

async function run(sql: string | { sql: string; args: any[] }) {
  await client.execute(sql)
}

async function main() {
  console.log('Conectado ao Turso. Criando tabelas...')

  await run(`
    CREATE TABLE IF NOT EXISTS "usuarios" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "nome" TEXT NOT NULL,
      "usuario" TEXT NOT NULL,
      "senha" TEXT NOT NULL,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)
  await run('CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_usuario_key" ON "usuarios"("usuario");')

  await run(`
    CREATE TABLE IF NOT EXISTS "marcas" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "nome" TEXT NOT NULL,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME NOT NULL
    );
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS "clientes" (
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
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS "produtos" (
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
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS "compras" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "fornecedor" TEXT NOT NULL,
      "data_compra" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "valor_total" REAL NOT NULL,
      "observacao" TEXT,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS "itens_compra" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "compra_id" INTEGER NOT NULL,
      "produto_id" INTEGER NOT NULL,
      "quantidade" INTEGER NOT NULL,
      "preco_estimado" REAL NOT NULL,
      "preco_real" REAL NOT NULL,
      CONSTRAINT "itens_compra_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compras" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "itens_compra_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS "pagamentos_compra" (
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
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS "vendas" (
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
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS "itens_venda" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "venda_id" INTEGER NOT NULL,
      "produto_id" INTEGER NOT NULL,
      "quantidade" INTEGER NOT NULL,
      "preco_estimado" REAL NOT NULL,
      "preco_real" REAL NOT NULL,
      CONSTRAINT "itens_venda_venda_id_fkey" FOREIGN KEY ("venda_id") REFERENCES "vendas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "itens_venda_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS "pagamentos_venda" (
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
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS "sorteios" (
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
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS "itens_sorteio" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "sorteio_id" INTEGER NOT NULL,
      "numero" INTEGER NOT NULL,
      "cliente_id" INTEGER,
      "nome_cliente" TEXT NOT NULL DEFAULT '',
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "itens_sorteio_sorteio_id_fkey" FOREIGN KEY ("sorteio_id") REFERENCES "sorteios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
  `)
  await run('CREATE UNIQUE INDEX IF NOT EXISTS "itens_sorteio_sorteio_id_numero_key" ON "itens_sorteio"("sorteio_id", "numero");')

  await run(`
    CREATE TABLE IF NOT EXISTS "fornecedores" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "nome" TEXT NOT NULL,
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)

  const comprasInfo = await client.execute({ sql: "PRAGMA table_info('compras')", args: [] })
  const hasFornecedorId = comprasInfo.rows.some((r: any) => r.name === 'fornecedor_id')
  if (!hasFornecedorId) {
    await run('ALTER TABLE "compras" ADD COLUMN "fornecedor_id" INTEGER;')
  }

  console.log('Tabelas criadas!')

  const adminHash = await bcrypt.hash('admin123', 10)
  const julHash = await bcrypt.hash('P#0312c7', 10)
  const jpHash = await bcrypt.hash('jpdps@10crs', 10)

  await run({
    sql: 'INSERT OR IGNORE INTO usuarios (nome, usuario, senha) VALUES (?, ?, ?)',
    args: ['Administrador', 'admin', adminHash],
  })
  await run({
    sql: 'INSERT OR IGNORE INTO usuarios (nome, usuario, senha) VALUES (?, ?, ?)',
    args: ['Juliene Machado', 'julienemachado', julHash],
  })
  await run({
    sql: 'INSERT OR IGNORE INTO usuarios (nome, usuario, senha) VALUES (?, ?, ?)',
    args: ['João Paulo DPS', 'joaopaulodps', jpHash],
  })
  console.log('Usuarios criados: admin, julienemachado, joaopaulodps')

  await run({
    sql: 'INSERT OR IGNORE INTO fornecedores (nome) VALUES (?)',
    args: ['O Boticário'],
  })
  console.log('Fornecedor padrao criado: O Boticário')

  console.log('Setup do Turso concluido!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
