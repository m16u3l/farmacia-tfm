// Mock data for testing
export const mockProduct = {
  product_id: 1,
  name: 'Paracetamol 500mg',
  description: 'Analgésico y antipirético',
  price: 15.50,
  category: 'Medicamentos',
  supplier_id: 1,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z'
}

export const mockInventory = {
  inventory_id: 1,
  product_id: 1,
  batch_number: 'BATCH001',
  expiry_date: '2025-12-31',
  quantity_available: 100,
  location: 'A1',
  purchase_price: 12.00,
  sale_price: 15.50
}

export const mockEmployee = {
  employee_id: 1,
  first_name: 'Juan',
  last_name: 'Pérez',
  email: 'juan.perez@biofarm.com',
  phone: '555-0123',
  position: 'Farmacéutico',
  department: 'Farmacia',
  hire_date: '2024-01-01',
  salary: 50000,
  status: true
}

export const mockSupplier = {
  supplier_id: 1,
  name: 'Laboratorios ABC',
  contact_name: 'María García',
  phone: '555-0456',
  email: 'contacto@labsabc.com',
  address: 'Av. Principal 123, Ciudad'
}

export const mockSell = {
  sell_id: 1,
  employee_id: 1,
  sell_date: '2024-01-01T10:00:00.000Z',
  total_amount: 31.00,
  payment_method: 'efectivo'
}

export const mockUser = {
  id: 1,
  first_name: 'Admin',
  last_name: 'User',
  email: 'admin@biofarm.com'
}

// Mock API responses
export const mockApiResponse = {
  success: true,
  data: null,
  message: 'Operation completed successfully'
}

// Mock fetch responses
export const createMockFetchResponse = (data: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
})

// Database connection mock
export const mockDbConnection = () => ({
  query: jest.fn(),
  end: jest.fn(),
})

// Mock fetch function
export const mockFetch = jest.fn()

// Mock services
export const mockInventoryService = {
  getAllInventory: jest.fn(),
  createInventory: jest.fn(),
  updateInventory: jest.fn(),
  deleteInventory: jest.fn(),
}

export const mockProductsService = {
  getAllProducts: jest.fn(),
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
  deleteProduct: jest.fn(),
}

export const mockEmployeesService = {
  getAllEmployees: jest.fn(),
  createEmployee: jest.fn(),
  updateEmployee: jest.fn(),
  deleteEmployee: jest.fn(),
}

export const mockSuppliersService = {
  getAllSuppliers: jest.fn(),
  createSupplier: jest.fn(),
  updateSupplier: jest.fn(),
  deleteSupplier: jest.fn(),
}

export const mockSellsService = {
  getAllSells: jest.fn(),
  createSell: jest.fn(),
  updateSell: jest.fn(),
  deleteSell: jest.fn(),
}
