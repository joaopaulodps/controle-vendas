const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const marcas = await Promise.all([
    prisma.marca.upsert({ where: { id: 1 }, update: {}, create: { nome: 'Nike' } }),
    prisma.marca.upsert({ where: { id: 2 }, update: {}, create: { nome: 'Adidas' } }),
    prisma.marca.upsert({ where: { id: 3 }, update: {}, create: { nome: 'Puma' } }),
    prisma.marca.upsert({ where: { id: 4 }, update: {}, create: { nome: 'Olympikus' } }),
    prisma.marca.upsert({ where: { id: 5 }, update: {}, create: { nome: 'Lupo' } }),
  ])
  console.log('Marcas criadas:', marcas.length)

  const produtos = [
    { nome: 'Camiseta Básica', codigoProduto: 'NIKE-001', marcaId: marcas[0].id, estoque: 100, unidade: 'un' },
    { nome: 'Calça Jeans', codigoProduto: 'ADI-010', marcaId: marcas[1].id, estoque: 50, unidade: 'un' },
    { nome: 'Tênis Esportivo', codigoProduto: 'PUMA-100', marcaId: marcas[2].id, estoque: 30, unidade: 'un' },
    { nome: 'Boné Aba Reta', codigoProduto: 'OLY-020', marcaId: marcas[3].id, estoque: 80, unidade: 'un' },
    { nome: 'Mochila Escolar', codigoProduto: 'LUP-030', marcaId: marcas[4].id, estoque: 40, unidade: 'un' },
  ]

  for (const p of produtos) {
    await prisma.produto.upsert({
      where: { id: produtos.indexOf(p) + 1 },
      update: { codigoProduto: p.codigoProduto, marcaId: p.marcaId },
      create: p,
    })
  }
  console.log('Produtos atualizados com códigos e marcas')

  const clientes = await Promise.all([
    prisma.cliente.upsert({ where: { id: 1 }, update: {}, create: { nome: 'Maria Silva', cpf: '111.222.333-44', telefone: '(11) 91111-1111' } }),
    prisma.cliente.upsert({ where: { id: 2 }, update: {}, create: { nome: 'João Santos', cpf: '555.666.777-88', telefone: '(11) 92222-2222' } }),
    prisma.cliente.upsert({ where: { id: 3 }, update: {}, create: { nome: 'Ana Oliveira', cpf: '999.888.777-66', telefone: '(11) 93333-3333' } }),
  ])
  console.log('Clientes criados:', clientes.length)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
