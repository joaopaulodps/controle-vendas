require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const { createClient } = require('@libsql/client')

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

async function run(sql) {
  await client.execute(sql)
}

async function main() {
  console.log('Limpando banco de dados (mantendo apenas usuarios)...')

  await run('DELETE FROM itens_sorteio')
  console.log('  itens_sorteio limpo')

  await run('DELETE FROM itens_venda')
  console.log('  itens_venda limpo')

  await run('DELETE FROM itens_compra')
  console.log('  itens_compra limpo')

  await run('DELETE FROM pagamentos_venda')
  console.log('  pagamentos_venda limpo')

  await run('DELETE FROM pagamentos_compra')
  console.log('  pagamentos_compra limpo')

  await run('DELETE FROM vendas')
  console.log('  vendas limpo')

  await run('DELETE FROM compras')
  console.log('  compras limpo')

  await run('DELETE FROM produtos')
  console.log('  produtos limpo')

  await run('DELETE FROM marcas')
  console.log('  marcas limpo')

  await run('DELETE FROM clientes')
  console.log('  clientes limpo')

  await run('DELETE FROM sorteios')
  console.log('  sorteios limpo')

  const result = await client.execute('SELECT COUNT(*) as total FROM usuarios')
  console.log(`\nBanco limpo! Usuarios mantidos: ${result.rows[0].total}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
