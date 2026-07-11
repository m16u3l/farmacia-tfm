import { act, renderHook, waitFor } from '@testing-library/react'
import { useCashRegisterClosures } from '../useCashRegisterClosures'

const mockFetch = global.fetch as jest.Mock

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(body),
  })
}

describe('useCashRegisterClosures', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue(jsonResponse([]))
  })

  it('fetches closures on mount', async () => {
    const closures = [{ closure_id: 1, sell_count: 2 }]
    mockFetch.mockResolvedValueOnce(jsonResponse(closures))

    const { result } = renderHook(() => useCashRegisterClosures())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.closures).toEqual(closures)
    expect(mockFetch).toHaveBeenCalledWith('/api/cash-register-closures')
  })

  it('createClosure posts the counted cash and refreshes the list', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([])) // initial fetch on mount
    const { result } = renderHook(() => useCashRegisterClosures())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    mockFetch.mockResolvedValueOnce(jsonResponse({ closure_id: 5 }, true)) // POST
    mockFetch.mockResolvedValueOnce(jsonResponse([{ closure_id: 5 }])) // refresh

    await act(async () => {
      await result.current.createClosure({ counted_cash: 100 })
    })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/cash-register-closures',
      expect.objectContaining({ method: 'POST' })
    )
    expect(result.current.closures).toEqual([{ closure_id: 5 }])
  })

  it('createClosure throws the server error message on failure', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([])) // initial fetch on mount
    const { result } = renderHook(() => useCashRegisterClosures())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'No hay ventas pendientes de cierre' }, false))

    await expect(
      act(async () => {
        await result.current.createClosure({ counted_cash: 0 })
      })
    ).rejects.toThrow('No hay ventas pendientes de cierre')
  })

  it('cancelClosure posts to the cancel endpoint and refreshes the list', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([])) // initial fetch on mount
    const { result } = renderHook(() => useCashRegisterClosures())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    mockFetch.mockResolvedValueOnce(jsonResponse({ closure_id: 5, status: 'cancelled' })) // POST cancel
    mockFetch.mockResolvedValueOnce(jsonResponse([])) // refresh

    await act(async () => {
      await result.current.cancelClosure(5)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/cash-register-closures/5/cancel', { method: 'POST' })
  })
})
