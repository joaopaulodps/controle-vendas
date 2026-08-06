import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const produto = await prisma.produto.findUnique({
      where: { id: Number(params.id) },
      include: { marca: true },
    })
    if (!produto) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    return NextResponse.json(produto)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar produto' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { nome, codigoProduto, marcaId, estoque, unidade } = body

    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    if (!codigoProduto) {
      return NextResponse.json({ error: 'Código do produto é obrigatório' }, { status: 400 })
    }

    const produto = await prisma.produto.update({
      where: { id: Number(params.id) },
      data: {
        nome,
        codigoProduto,
        marcaId: marcaId || null,
        estoque: Number(estoque),
        unidade,
      },
    })

    return NextResponse.json(produto)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.produto.delete({ where: { id: Number(params.id) } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir produto' }, { status: 500 })
  }
}