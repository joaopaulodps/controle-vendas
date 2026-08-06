import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const fornecedores = await prisma.fornecedor.findMany({
      orderBy: { nome: 'asc' },
    })
    return NextResponse.json(fornecedores)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar fornecedores' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome } = body

    if (!nome || !nome.trim()) {
      return NextResponse.json({ error: 'Nome do fornecedor é obrigatório' }, { status: 400 })
    }

    const existente = await prisma.fornecedor.findFirst({ where: { nome: nome.trim() } })
    if (existente) {
      return NextResponse.json({ error: 'Fornecedor já cadastrado' }, { status: 400 })
    }

    const fornecedor = await prisma.fornecedor.create({
      data: { nome: nome.trim() },
    })

    return NextResponse.json(fornecedor, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar fornecedor' }, { status: 500 })
  }
}
