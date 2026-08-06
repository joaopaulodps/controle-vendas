import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { nome: 'asc' },
      take: 500,
    })
    return NextResponse.json(clientes)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, cpf, telefone, email, endereco, observacao } = body

    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const cliente = await prisma.cliente.create({
      data: { nome, cpf, telefone, email, endereco, observacao },
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 })
  }
}