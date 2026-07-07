import { createContext, useContext } from 'react'
import type { AppState } from '../types'

export interface AppContextValue {
  state: AppState | null
  refetch: () => void
}

export const AppContext = createContext<AppContextValue>({
  state: null,
  refetch: () => {},
})

export function useApp(): AppContextValue {
  return useContext(AppContext)
}
