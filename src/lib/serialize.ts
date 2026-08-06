export function serializeDecimal(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'object' && obj.constructor?.name === 'Decimal') {
    return obj.toNumber()
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeDecimal)
  }
  if (typeof obj === 'object') {
    const result: any = {}
    for (const key of Object.keys(obj)) {
      result[key] = serializeDecimal(obj[key])
    }
    return result
  }
  return obj
}