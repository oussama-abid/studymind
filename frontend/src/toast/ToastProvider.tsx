import { type ReactNode, useCallback, useMemo, useState } from 'react'

import { ToastContext, type ToastKind } from './ToastContext'

type Toast = {
  id: number
  message: string
  kind: ToastKind
}

const SHOW_FOR_MS = 5000

let nextId = 1

// Small popups in the bottom right corner that disappear by themselves
function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const closeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, kind: ToastKind = 'success') => {
      const id = nextId++
      setToasts((current) => [...current, { id, message, kind }])
      setTimeout(() => closeToast(id), SHOW_FOR_MS)
    },
    [closeToast],
  )

  // The same object on every render, so components using it don't re-run effects
  const api = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* role="status": screen readers announce new toasts without moving the focus */}
      <div
        role="status"
        className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex animate-enter items-start gap-3 rounded-xl border bg-white p-4 shadow-lg ${
              toast.kind === 'error' ? 'border-red-300' : 'border-line'
            }`}
          >
            <span
              aria-hidden="true"
              className={`mt-1.5 size-2.5 shrink-0 rounded-full ${
                toast.kind === 'error' ? 'bg-red-600' : 'bg-green-600'
              }`}
            />
            <p className="flex-1 text-sm">{toast.message}</p>
            <button
              type="button"
              onClick={() => closeToast(toast.id)}
              aria-label="Close notification"
              className="rounded px-1 text-lg leading-none text-muted hover:text-ink"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider
