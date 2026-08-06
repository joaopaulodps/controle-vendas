export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const marca = await prisma.marca.findUnique({ where: { id: Number(params.id) } })
    if (!marca) return NextResponse.json({ error: 'Marca não encontrada' }, { status: 404 })
    return NextResponse.json(marca)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar marca' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { nome } = body

    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const marca = await prisma.marca.update({
      where: { id: Number(params.id) },
      data: { nome },
    })

    return NextResponse.json(marca)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar marca' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const produtos = await prisma.produto.count({ where: { marcaId: Number(params.id) } })
    if (produtos > 0) {
      return NextResponse.json({ error: 'Não é possível excluir marca com produtos vinculados' }, { status: 400 })
    }
    await prisma.marca.delete({ where: { id: Number(params.id) } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir marca' }, { status: 500 })
  }
}