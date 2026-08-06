import { prisma } from '@/lib/prisma'
import { serializeDecimal } from '@/lib/serialize'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const sorteios = await prisma.sorteio.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        _count: { select: { itens: true, vendas: true } },
      },
    })
    return NextResponse.json(serializeDecimal(sorteios))
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar sorteios' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, descricao, totalNumeros, valorIngresso, dataSorteio } = body

    if (!nome || !totalNumeros || !valorIngresso) {
      return NextResponse.json({ error: 'Nome, total de números e valor do ingresso são obrigatórios' }, { status: 400 })
    }

    const sorteio = await prisma.sorteio.create({
      data: {
        nome,
        descricao,
        totalNumeros: Number(totalNumeros),
        valorIngresso: Number(valorIngresso),
        dataSorteio: dataSorteio ? new Date(dataSorteio) : null,
      },
    })

    return NextResponse.json(serializeDecimal(sorteio), { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar sorteio' }, { status: 500 })
  }
}