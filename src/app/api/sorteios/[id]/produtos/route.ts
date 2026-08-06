import { prisma } from '@/lib/prisma'
import { serializeDecimal } from '@/lib/serialize'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const produtos = await prisma.produtoSorteio.findMany({
      where: { sorteioId: Number(params.id) },
      include: {
        produto: {
          select: { id: true, nome: true, estoque: true, unidade: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(serializeDecimal(produtos))
  } catch (error) {
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { produtoId, quantidade, precoUnitario } = body
    const sorteioId = Number(params.id)

    if (!produtoId || !quantidade || !precoUnitario) {
      return NextResponse.json({ error: 'Produto, quantidade e preço são obrigatórios' }, { status: 400 })
    }

    const sorteio = await prisma.sorteio.findUnique({ where: { id: sorteioId } })
    if (!sorteio) return NextResponse.json({ error: 'Sorteio não encontrado' }, { status: 404 })

    const produto = await prisma.produto.findUnique({ where: { id: Number(produtoId) } })
    if (!produto) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

    if (Number(quantidade) > produto.estoque) {
      return NextResponse.json({ error: `Estoque insuficiente. Disponível: ${produto.estoque}` }, { status: 400 })
    }

    const existente = await prisma.produtoSorteio.findUnique({
      where: { sorteioId_produtoId: { sorteioId, produtoId: Number(produtoId) } },
    })

    if (existente) {
      return NextResponse.json({ error: 'Produto já vinculado a este sorteio. Edite a vinculação existente.' }, { status: 400 })
    }

    const item = await prisma.produtoSorteio.create({
      data: {
        sorteioId,
        produtoId: Number(produtoId),
        quantidade: Number(quantidade),
        precoUnitario: Number(precoUnitario),
      },
      include: {
        produto: {
          select: { id: true, nome: true, estoque: true, unidade: true },
        },
      },
    })

    return NextResponse.json(serializeDecimal(item), { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Tabela de produtos do sorteio não configurada. Contate o administrador.' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Erro ao vincular produto' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { itemId, quantidade, precoUnitario } = body
    const sorteioId = Number(params.id)

    if (!itemId || !quantidade || !precoUnitario) {
      return NextResponse.json({ error: 'ID do item, quantidade e preço são obrigatórios' }, { status: 400 })
    }

    const existente = await prisma.produtoSorteio.findUnique({
      where: { id: Number(itemId) },
      include: { produto: true },
    })

    if (!existente || existente.sorteioId !== sorteioId) {
      return NextResponse.json({ error: 'Vinculação não encontrada' }, { status: 404 })
    }

    if (Number(quantidade) > existente.produto.estoque) {
      return NextResponse.json({ error: `Estoque insuficiente. Disponível: ${existente.produto.estoque}` }, { status: 400 })
    }

    const item = await prisma.produtoSorteio.update({
      where: { id: Number(itemId) },
      data: {
        quantidade: Number(quantidade),
        precoUnitario: Number(precoUnitario),
      },
      include: {
        produto: {
          select: { id: true, nome: true, estoque: true, unidade: true },
        },
      },
    })

    return NextResponse.json(serializeDecimal(item))
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar vinculação' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json({ error: 'ID do item é obrigatório' }, { status: 400 })
    }

    const existente = await prisma.produtoSorteio.findUnique({
      where: { id: Number(itemId) },
    })

    if (!existente || existente.sorteioId !== Number(params.id)) {
      return NextResponse.json({ error: 'Vinculação não encontrada' }, { status: 404 })
    }

    await prisma.produtoSorteio.delete({
      where: { id: Number(itemId) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover vinculação' }, { status: 500 })
  }
}