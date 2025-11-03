import { inventoryService } from '../inventoryService'
import { mockInventory } from '@/test-utils/mocks'

// Mock the api service
jest.mock('../api', () => ({
  apiRequest: jest.fn()
}))

import { apiRequest } from '../api'
const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>

describe('inventoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAll', () => {
    it('should return all inventory items', async () => {
      const mockInventoryItems = [mockInventory]
      mockApiRequest.mockResolvedValue(mockInventoryItems)

      const result = await inventoryService.getAll()

      expect(mockApiRequest).toHaveBeenCalledWith('/api/inventory')
      expect(result).toEqual(mockInventoryItems)
    })

    it('should handle API error', async () => {
      mockApiRequest.mockRejectedValue(new Error('API error'))

      await expect(inventoryService.getAll()).rejects.toThrow('API error')
    })
  })

  describe('create', () => {
    it('should create a new inventory item', async () => {
      const newInventoryData = {
        product_id: 1,
        batch_number: 'BATCH002',
        expiry_date: '2025-06-30',
        quantity_available: 50,
        location: 'A1',
        purchase_price: 10.00,
        sale_price: 15.50
      }

      const mockCreatedItem = { ...newInventoryData, inventory_id: 2 }
      mockApiRequest.mockResolvedValue(mockCreatedItem)

      const result = await inventoryService.create(newInventoryData)

      expect(mockApiRequest).toHaveBeenCalledWith('/api/inventory', {
        method: 'POST',
        body: newInventoryData
      })
      expect(result).toEqual(mockCreatedItem)
    })
  })

  describe('update', () => {
    it('should update an inventory item', async () => {
      const updateData = { 
        product_id: 1,
        batch_number: 'BATCH002',
        expiry_date: '2025-06-30',
        quantity_available: 75, 
        location: 'A1',
        purchase_price: 11.00,
        sale_price: 16.00
      }
      const mockUpdatedItem = { ...mockInventory, ...updateData }
      mockApiRequest.mockResolvedValue(mockUpdatedItem)

      const result = await inventoryService.update(1, updateData)

      expect(mockApiRequest).toHaveBeenCalledWith('/api/inventory/1', {
        method: 'PUT',
        body: updateData
      })
      expect(result).toEqual(mockUpdatedItem)
    })
  })

  describe('delete', () => {
    it('should delete an inventory item', async () => {
      mockApiRequest.mockResolvedValue(undefined)

      await inventoryService.delete(1)

      expect(mockApiRequest).toHaveBeenCalledWith('/api/inventory/1', {
        method: 'DELETE'
      })
    })
  })

  describe('getLowStock', () => {
    it('should return low stock items', async () => {
      const mockLowStockItems = [mockInventory]
      mockApiRequest.mockResolvedValue(mockLowStockItems)

      const result = await inventoryService.getLowStock(10)

      expect(mockApiRequest).toHaveBeenCalledWith('/api/inventory?low_stock=10')
      expect(result).toEqual(mockLowStockItems)
    })
  })

  describe('getByProduct', () => {
    it('should return inventory items by product', async () => {
      const mockProductInventory = [mockInventory]
      mockApiRequest.mockResolvedValue(mockProductInventory)

      const result = await inventoryService.getByProduct(1)

      expect(mockApiRequest).toHaveBeenCalledWith('/api/inventory?product_id=1')
      expect(result).toEqual(mockProductInventory)
    })
  })
})
