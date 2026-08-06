import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const venda = await prisma.venda.findUnique({
      where: { id: Number(params.id) },
      include: {
        itens: true,
        pagamentos: true,
      },
    })

    if (!venda) {
      return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.pagamentoVenda.deleteMany({ where: { vendaId: venda.id } })
      await tx.itemVenda.deleteMany({ where: { vendaId: venda.id } })
      await tx.venda.delete({ where: { id: venda.id } })

      for (const item of venda.itens) {
        await tx.produto.update({
          where: { id: item.produtoId },
          data: { estoque: { increment: item.quantidade } },
        })
      }
    })

    return NextResponse.json({ message: 'Venda excluída com sucesso' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir venda' }, { status: 500 })
  }
}
