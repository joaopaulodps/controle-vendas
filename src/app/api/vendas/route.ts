import { prisma } from '@/lib/prisma'
import { serializeDecimal } from '@/lib/serialize'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const vendas = await prisma.venda.findMany({
      orderBy: { dataVenda: 'desc' },
      take: 100,
      include: {
        itens: { include: { produto: { select: { id: true, nome: true } } } },
        pagamentos: true,
        sorteio: { select: { id: true, nome: true } },
      },
    })
    return NextResponse.json(serializeDecimal(vendas), {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar vendas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cliente, observacao, itens, pagamentos, sorteioId } = body

    if (!cliente || !itens || itens.length === 0) {
      return NextResponse.json({ error: 'Cliente e itens são obrigatórios' }, { status: 400 })
    }

    if (!sorteioId && (!pagamentos || pagamentos.length === 0)) {
      return NextResponse.json({ error: 'Forma de pagamento é obrigatória' }, { status: 400 })
    }

    const produtoIds = itens.map((item: { produtoId: number }) => item.produtoId)
    const produtos = await prisma.produto.findMany({
      where: { id: { in: produtoIds } },
    })

    const produtoMap = new Map(produtos.map(p => [p.id, p]))

    for (const item of itens) {
      const produto = produtoMap.get(item.produtoId)
      if (!produto) {
        return NextResponse.json({ error: `Produto ID ${item.produtoId} não encontrado` }, { status: 404 })
      }
      if (produto.estoque < item.quantidade) {
        return NextResponse.json(
          { error: `Estoque insuficiente para "${produto.nome}". Disponível: ${produto.estoque}, Solicitado: ${item.quantidade}` },
          { status: 400 }
        )
      }
    }

    const valorTotal = itens.reduce(
      (sum: number, item: { quantidade: number; precoReal: number }) => sum + item.quantidade * item.precoReal,
      0
    )

    const venda = await prisma.$transaction(async (tx) => {
      const vendaData: any = {
        cliente,
        valorTotal,
        observacao,
        itens: {
          create: itens.map((item: { produtoId: number; quantidade: number; precoEstimado: number; precoReal: number }) => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            precoEstimado: item.precoEstimado,
            precoReal: item.precoReal,
          })),
        },
      }

      if (sorteioId) {
        vendaData.sorteioId = sorteioId
        vendaData.valorTotal = 0
      } else {
        vendaData.pagamentos = {
          create: pagamentos.map((pag: { formaPagamento: string; parcela: number; valor: number; dataVencimento: string }) => ({
            formaPagamento: pag.formaPagamento,
            parcela: pag.parcela,
            valor: pag.valor,
            dataVencimento: new Date(pag.dataVencimento),
          })),
        }
      }

      const vendaCriada = await tx.venda.create({
        data: vendaData,
        include: { itens: true, pagamentos: true },
      })

      for (const item of itens) {
        await tx.produto.update({
          where: { id: item.produtoId },
          data: { estoque: { decrement: item.quantidade } },
        })
      }

      return vendaCriada
    })

    return NextResponse.json(serializeDecimal(venda), { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar venda' }, { status: 500 })
  }
}