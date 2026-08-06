import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const fornecedor = await prisma.fornecedor.findUnique({
      where: { id: Number(params.id) },
    })
    if (!fornecedor) {
      return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 })
    }
    return NextResponse.json(fornecedor)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar fornecedor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { nome } = body

    if (!nome || !nome.trim()) {
      return NextResponse.json({ error: 'Nome do fornecedor é obrigatório' }, { status: 400 })
    }

    const fornecedor = await prisma.fornecedor.update({
      where: { id: Number(params.id) },
      data: { nome: nome.trim() },
    })

    return NextResponse.json(fornecedor)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar fornecedor' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const compras = await prisma.compra.count({ where: { fornecedorId: Number(params.id) } })
    if (compras > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir fornecedor vinculado a compras' },
        { status: 400 }
      )
    }

    await prisma.fornecedor.delete({ where: { id: Number(params.id) } })
    return NextResponse.json({ message: 'Fornecedor excluído com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir fornecedor' }, { status: 500 })
  }
}
