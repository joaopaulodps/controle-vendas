import { ReactNode } from 'react'

interface DataTableProps<T> {
  data: T[]
  isLoading: boolean
  columns: { key: string; label: string; className?: string; render?: (item: T) => ReactNode }[]
  emptyMessage?: string
}

export function DataTable<T extends { id: number | string }>({
  data,
  isLoading,
  columns,
  emptyMessage = 'Nenhum registro encontrado.'
}: DataTableProps<T>) {
  return (
    <div className="card overflow-hidden p-0">
      <table className="w-full">
        <thead className="table-header">
          <tr>
            {columns.map(col => (
              <th key={col.key} className={`table-cell ${col.className || 'text-left'}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y dark:divide-gray-700">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="table-cell text-center py-8 text-muted">
                Carregando...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-cell text-center py-8 text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map(item => (
              <tr key={item.id} className="table-row">
                {columns.map(col => (
                  <td key={col.key} className={`table-cell ${col.className || ''}`}>
                    {col.render ? col.render(item) : (item as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}