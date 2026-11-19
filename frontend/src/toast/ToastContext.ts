import { createContext, useContext } from 'react'

export type ToastKind = 'success' | 'error'

type ToastApi = {
  showToast: (message: string, kind?: ToastKind) => void
}

// Without a ToastProvider (e.g. in a component test), toasts are simply ignored
export const ToastContext = createContext<ToastApi>({ showToast: () => {} })

export function useToast(): ToastApi {
  return useContext(ToastContext)
}
