import { act, renderHook, waitFor } from '@testing-library/react'
import { useValidations } from '../useValidations'

jest.mock('@/services/validationService', () => ({
  validationService: {
    createSession: jest.fn(),
    getSession: jest.fn(),
    getAll: jest.fn(),
    verifyItem: jest.fn(),
    complete: jest.fn(),
    cancel: jest.fn(),
    applyAdjustments: jest.fn()
  }
}))

import { validationService } from '@/services/validationService'
const mockService = validationService as jest.Mocked<typeof validationService>

describe('useValidations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('createSession returns the created session and clears loading', async () => {
    const mockSession = { validation_id: 1, type: 'area', status: 'in_progress', items: [] }
    mockService.createSession.mockResolvedValue(mockSession as never)

    const { result } = renderHook(() => useValidations())

    let session
    await act(async () => {
      session = await result.current.createSession({ type: 'area', area_id: 1 })
    })

    expect(session).toEqual(mockSession)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('createSession sets error and returns null on failure', async () => {
    mockService.createSession.mockRejectedValue(new Error('Ya existe una validación en progreso'))

    const { result } = renderHook(() => useValidations())

    let session
    await act(async () => {
      session = await result.current.createSession({ type: 'area', area_id: 1 })
    })

    expect(session).toBeNull()
    await waitFor(() => expect(result.current.error).toBe('Ya existe una validación en progreso'))
  })

  it('getAll returns an empty array on failure instead of throwing', async () => {
    mockService.getAll.mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() => useValidations())

    let sessions
    await act(async () => {
      sessions = await result.current.getAll('in_progress')
    })

    expect(sessions).toEqual([])
    expect(mockService.getAll).toHaveBeenCalledWith('in_progress')
  })

  it('applyAdjustments returns the applied/skipped summary', async () => {
    const mockResult = {
      validation: { validation_id: 1, status: 'completed' },
      applied: [{ inventory_id: 10, from: 15, to: 8 }],
      skipped: []
    }
    mockService.applyAdjustments.mockResolvedValue(mockResult as never)

    const { result } = renderHook(() => useValidations())

    let outcome
    await act(async () => {
      outcome = await result.current.applyAdjustments(1)
    })

    expect(mockService.applyAdjustments).toHaveBeenCalledWith(1)
    expect(outcome).toEqual(mockResult)
  })
})
