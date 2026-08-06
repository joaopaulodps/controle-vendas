const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const fornecedores = await Promise.all([
    prisma.fornecedor.create({ data: { nome: 'Distribuidora ABC', cnpj: '12.345.678/0001-90', telefone: '(11) 99999-1111', email: 'contato@abc.com' } }),
    prisma.fornecedor.create({ data: { nome: 'Atacado XYZ', cnpj: '98.765.432/0001-10', telefone: '(11) 88888-2222', email: 'vendas@xyz.com' } }),
    prisma.fornecedor.create({ data: { nome: 'Importadora Tech', cnpj: '11.222.333/0001-44', telefone: '(21) 77777-3333', email: 'compras@tech.com' } }),
  ])
  console.log('Fornecedores criados:', fornecedores.length)

  const clientes = await Promise.all([
    prisma.cliente.create({ data: { nome: 'Maria Silva', cpf: '111.222.333-44', telefone: '(11) 91111-1111', email: 'maria@email.com' } }),
    prisma.cliente.create({ data: { nome: 'João Santos', cpf: '555.666.777-88', telefone: '(11) 92222-2222', email: 'joao@email.com' } }),
    prisma.cliente.create({ data: { nome: 'Ana Oliveira', cpf: '999.888.777-66', telefone: '(11) 93333-3333', email: 'ana@email.com' } }),
  ])
  console.log('Clientes criados:', clientes.length)

  const produtos = await prisma.produto.findMany()
  if (produtos.length > 0) {
    await prisma.produto.update({ where: { id: produtos[0].id }, data: { codigoFornecedor: 'ABC-001', fornecedorId: fornecedores[0].id } })
    await prisma.produto.update({ where: { id: produtos[1].id }, data: { codigoFornecedor: 'XYZ-010', fornecedorId: fornecedores[1].id } })
    await prisma.produto.update({ where: { id: produtos[2].id }, data: { codigoFornecedor: 'TECH-100', fornecedorId: fornecedores[2].id } })
    console.log('Produtos atualizados com fornecedores')
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

export {}
