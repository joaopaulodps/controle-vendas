export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { serializeDecimal } from '@/lib/serialize'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sorteio = await prisma.sorteio.findUnique({
      where: { id: Number(params.id) },
      include: {
        itens: { orderBy: { numero: 'asc' } },
        _count: { select: { itens: true } },
      },
    })
    if (!sorteio) return NextResponse.json({ error: 'Sorteio não encontrado' }, { status: 404 })
    return NextResponse.json(serializeDecimal(sorteio))
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar sorteio' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { nome, descricao, totalNumeros, valorIngresso, dataSorteio, status } = body

    const sorteio = await prisma.sorteio.update({
      where: { id: Number(params.id) },
      data: {
        nome,
        descricao,
        totalNumeros: totalNumeros ? Number(totalNumeros) : undefined,
        valorIngresso: valorIngresso ? Number(valorIngresso) : undefined,
        dataSorteio: dataSorteio ? new Date(dataSorteio) : undefined,
        status,
      },
    })

    return NextResponse.json(serializeDecimal(sorteio))
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar sorteio' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.itemSorteio.deleteMany({ where: { sorteioId: Number(params.id) } })
      await tx.sorteio.delete({ where: { id: Number(params.id) } })
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir sorteio' }, { status: 500 })
  }
}