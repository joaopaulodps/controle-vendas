const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const usuarios = [
    { nome: 'Juliene Machado', usuario: 'julienemachado', senha: 'P#0312c7' },
    { nome: 'João Paulo DPS', usuario: 'joaopaulodps', senha: 'jpdps@10crs' },
  ]

  for (const u of usuarios) {
    const existente = await prisma.usuario.findUnique({ where: { usuario: u.usuario } })
    if (existente) {
      console.log(`Usuário ${u.usuario} já existe, pulando...`)
      continue
    }
    const hash = await bcrypt.hash(u.senha, 10)
    await prisma.usuario.create({
      data: { nome: u.nome, usuario: u.usuario, senha: hash },
    })
    console.log(`Usuário ${u.nome} (${u.usuario}) criado com sucesso`)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
