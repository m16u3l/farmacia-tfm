import { validationService } from '../validationService'

jest.mock('../api', () => ({
  apiRequest: jest.fn()
}))

import { apiRequest } from '../api'
const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>

describe('validationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createSession', () => {
    it('should create a validation session', async () => {
      const data = { type: 'area' as const, area_id: 1 }
      const mockSession = { validation_id: 1, ...data, status: 'in_progress', items: [] }
      mockApiRequest.mockResolvedValue(mockSession)

      const result = await validationService.createSession(data)

      expect(mockApiRequest).toHaveBeenCalledWith('/api/inventory-validations', {
        method: 'POST',
        body: data
      })
      expect(result).toEqual(mockSession)
    })
  })

  describe('getSession', () => {
    it('should fetch a single session with items', async () => {
      const mockSession = { validation_id: 1, type: 'area', status: 'in_progress', items: [] }
      mockApiRequest.mockResolvedValue(mockSession)

      const result = await validationService.getSession(1)

      expect(mockApiRequest).toHaveBeenCalledWith('/api/inventory-validations/1')
      expect(result).toEqual(mockSession)
    })
  })

  describe('getAll', () => {
    it('should fetch all sessions without a status filter', async () => {
      const mockSessions = [{ validation_id: 1, type: 'area', status: 'completed' }]
      mockApiRequest.mockResolvedValue(mockSessions)

      const result = await validationService.getAll()

      expect(mockApiRequest).toHaveBeenCalledWith('/api/inventory-validations')
      expect(result).toEqual(mockSessions)
    })

    it('should fetch sessions filtered by status', async () => {
      const mockSessions = [{ validation_id: 2, type: 'expiring', status: 'in_progress' }]
      mockApiRequest.mockResolvedValue(mockSessions)

      const result = await validationService.getAll('in_progress')

      expect(mockApiRequest).toHaveBeenCalledWith('/api/inventory-validations?status=in_progress')
      expect(result).toEqual(mockSessions)
    })
  })

  describe('verifyItem', () => {
    it('should verify a validation item', async () => {
      const data = { actual_quantity: 8, notes: 'Faltante' }
      const mockItem = { validation_item_id: 5, validation_id: 1, ...data, status: 'inconsistent' }
      mockApiRequest.mockResolvedValue(mockItem)

      const result = await validationService.verifyItem(1, 5, data)

      expect(mockApiRequest).toHaveBeenCalledWith('/api/inventory-validations/1/items/5', {
        method: 'PUT',
        body: data
      })
      expect(result).toEqual(mockItem)
    })
  })

  describe('complete', () => {
    it('should complete a validation session', async () => {
      const mockSession = { validation_id: 1, status: 'completed' }
      mockApiRequest.mockResolvedValue(mockSession)

      const result = await validationService.complete(1)

      expect(mockApiRequest).toHaveBeenCalledWith('/api/inventory-validations/1/complete', {
        method: 'POST'
      })
      expect(result).toEqual(mockSession)
    })
  })

  describe('cancel', () => {
    it('should cancel a validation session', async () => {
      const mockSession = { validation_id: 1, status: 'cancelled' }
      mockApiRequest.mockResolvedValue(mockSession)

      const result = await validationService.cancel(1)

      expect(mockApiRequest).toHaveBeenCalledWith('/api/inventory-validations/1/cancel', {
        method: 'POST'
      })
      expect(result).toEqual(mockSession)
    })
  })

  describe('applyAdjustments', () => {
    it('should apply inventory adjustments for a completed session', async () => {
      const mockResult = {
        validation: { validation_id: 1, status: 'completed', inventory_adjusted_at: '2026-07-10T00:00:00Z' },
        applied: [{ inventory_id: 10, from: 15, to: 8 }],
        skipped: []
      }
      mockApiRequest.mockResolvedValue(mockResult)

      const result = await validationService.applyAdjustments(1)

      expect(mockApiRequest).toHaveBeenCalledWith('/api/inventory-validations/1/apply-adjustments', {
        method: 'POST'
      })
      expect(result).toEqual(mockResult)
    })
  })
})
