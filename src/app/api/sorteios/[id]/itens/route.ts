import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { numero, clienteId, nomeCliente } = body
    const sorteioId = Number(params.id)

    if (!numero) {
      return NextResponse.json({ error: 'Número é obrigatório' }, { status: 400 })
    }

    if (!nomeCliente) {
      return NextResponse.json({ error: 'Cliente é obrigatório' }, { status: 400 })
    }

    const sorteio = await prisma.sorteio.findUnique({ where: { id: sorteioId } })
    if (!sorteio) return NextResponse.json({ error: 'Sorteio não encontrado' }, { status: 404 })

    if (numero < 1 || numero > sorteio.totalNumeros) {
      return NextResponse.json({ error: `Número deve ser entre 1 e ${sorteio.totalNumeros}` }, { status: 400 })
    }

    const existente = await prisma.itemSorteio.findUnique({
      where: { sorteioId_numero: { sorteioId, numero: Number(numero) } },
    })

    if (existente) {
      return NextResponse.json({ error: `Número ${numero} já está associado a ${existente.nomeCliente}` }, { status: 400 })
    }

    const item = await prisma.itemSorteio.create({
      data: {
        sorteioId,
        numero: Number(numero),
        clienteId: clienteId || null,
        nomeCliente,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar item' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { numero, clienteId, nomeCliente } = body
    const sorteioId = Number(params.id)

    if (!numero || !nomeCliente) {
      return NextResponse.json({ error: 'Número e cliente são obrigatórios' }, { status: 400 })
    }

    const item = await prisma.itemSorteio.update({
      where: { sorteioId_numero: { sorteioId, numero: Number(numero) } },
      data: {
        clienteId: clienteId || null,
        nomeCliente,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar item' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const numero = searchParams.get('numero')

    if (!numero) {
      return NextResponse.json({ error: 'Número é obrigatório' }, { status: 400 })
    }

    await prisma.itemSorteio.delete({
      where: { sorteioId_numero: { sorteioId: Number(params.id), numero: Number(numero) } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir item' }, { status: 500 })
  }
}