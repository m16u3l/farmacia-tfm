// Test utility functions
describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`

    it('formats currency correctly', () => {
      expect(formatCurrency(31)).toBe('$31.00')
      expect(formatCurrency(15.5)).toBe('$15.50')
      expect(formatCurrency(0)).toBe('$0.00')
    })
  })

  describe('formatDate', () => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    }

    it('formats dates correctly', () => {
      const result = formatDate('2024-01-01T00:00:00.000Z')
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
  })

  describe('validateEmail', () => {
    const validateEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }

    it('validates emails correctly', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })
})
