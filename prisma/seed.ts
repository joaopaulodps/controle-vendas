const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

function createPrismaClient() {
  if (process.env.TURSO_DATABASE_URL) {
    const { PrismaLibSQL } = require('@prisma/adapter-libsql')
    const { createClient } = require('@libsql/client')
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    return new PrismaClient({ adapter: new PrismaLibSQL(client) })
  }
  return new PrismaClient()
}

const prisma = createPrismaClient()

async function main() {
  const senhaHash = await bcrypt.hash('admin123', 10)

  await prisma.usuario.create({
    data: {
      nome: 'Administrador',
      usuario: 'admin',
      senha: senhaHash,
    },
  })
  console.log('Usuario admin criado')

  const produtos = await Promise.all([
    prisma.produto.create({ data: { nome: 'Camiseta Basica', estoque: 100, unidade: 'un', codigoProduto: 'CAM001' } }),
    prisma.produto.create({ data: { nome: 'Calca Jeans', estoque: 50, unidade: 'un', codigoProduto: 'CAL001' } }),
    prisma.produto.create({ data: { nome: 'Tenis Esportivo', estoque: 30, unidade: 'un', codigoProduto: 'TEN001' } }),
    prisma.produto.create({ data: { nome: 'Bone Aba Reta', estoque: 80, unidade: 'un', codigoProduto: 'BON001' } }),
    prisma.produto.create({ data: { nome: 'Mochila Escolar', estoque: 40, unidade: 'un', codigoProduto: 'MOC001' } }),
  ])

  console.log('Produtos criados:', produtos.length)

  const clientes = await Promise.all([
    prisma.cliente.create({ data: { nome: 'Joao Silva', cpf: '123.456.789-00', telefone: '(11) 99999-1234' } }),
    prisma.cliente.create({ data: { nome: 'Maria Santos', cpf: '987.654.321-00', telefone: '(11) 98888-5678' } }),
  ])

  console.log('Clientes criados:', clientes.length)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

export {}