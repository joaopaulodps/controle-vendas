import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const produtos = await prisma.produto.findMany({
      orderBy: { nome: 'asc' },
      take: 500,
      select: {
        id: true,
        nome: true,
        codigoProduto: true,
        marcaId: true,
        estoque: true,
        unidade: true,
        marca: { select: { id: true, nome: true } },
      },
    })
    return NextResponse.json(produtos, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, codigoProduto, marcaId, estoque, unidade } = body

    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    if (!codigoProduto) {
      return NextResponse.json({ error: 'Código do produto é obrigatório' }, { status: 400 })
    }

    const produto = await prisma.produto.create({
      data: {
        nome,
        codigoProduto,
        marcaId: marcaId || null,
        estoque: Number(estoque) || 0,
        unidade: unidade || 'un',
      },
    })

    return NextResponse.json(produto, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 })
  }
}