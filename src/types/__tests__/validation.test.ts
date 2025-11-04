// Test type validation and data structures
describe('Data Validation', () => {
  describe('Product validation', () => {
    const validateProduct = (product: unknown) => {
      if (!product || typeof product !== 'object') return false
      const p = product as Record<string, unknown>
      return (
        typeof p.name === 'string' &&
        typeof p.price === 'number' &&
        (p.price as number) > 0
      )
    }

    it('validates product data correctly', () => {
      const validProduct = {
        name: 'Paracetamol',
        price: 15.50,
        category: 'Medicamentos'
      }

      const invalidProduct = {
        name: '',
        price: -5
      }

      expect(validateProduct(validProduct)).toBe(true)
      expect(validateProduct(invalidProduct)).toBe(false)
      expect(validateProduct(null)).toBe(false)
    })
  })

  describe('Employee validation', () => {
    const validateEmployee = (employee: unknown) => {
      if (!employee || typeof employee !== 'object') return false
      const e = employee as Record<string, unknown>
      return (
        typeof e.first_name === 'string' &&
        typeof e.last_name === 'string' &&
        typeof e.email === 'string' &&
        (e.email as string).includes('@')
      )
    }

    it('validates employee data correctly', () => {
      const validEmployee = {
        first_name: 'Juan',
        last_name: 'Pérez',
        email: 'juan@biofarm.com'
      }

      const invalidEmployee = {
        first_name: '',
        email: 'invalid-email'
      }

      expect(validateEmployee(validEmployee)).toBe(true)
      expect(validateEmployee(invalidEmployee)).toBe(false)
    })
  })
})
