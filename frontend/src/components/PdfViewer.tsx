import { useEffect, useState } from 'react'

import { type Source } from '../api/chat'
import { fetchDocumentFile } from '../api/documents'

type PdfViewerProps = {
  courseId: number
  source: Source
  onClose: () => void
}

function PdfViewer({ courseId, source, onClose }: PdfViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const label = `${source.filename}, page ${source.page_number}`

  useEffect(() => {
    let url: string | null = null
    let closed = false

    fetchDocumentFile(courseId, source.document_id)
      .then((blob) => {
        if (closed) return
        url = URL.createObjectURL(blob)
        setFileUrl(url)
      })
      .catch((err) => {
        if (!closed) setError(err instanceof Error ? err.message : 'Could not open the PDF.')
      })

    return () => {
      closed = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [courseId, source.document_id])

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <aside
      role="dialog"
      aria-label={label}
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-2xl animate-slide-in flex-col border-l border-line bg-white shadow-2xl"
    >
      <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
        <p className="truncate font-bold">{label}</p>
        <button type="button" onClick={onClose} className="btn">
          Close
        </button>
      </header>

      {error && <p className="p-4 text-red-600">{error}</p>}
      {!error && !fileUrl && <p className="p-4 text-muted">Opening the PDF...</p>}
      {fileUrl && (
        <iframe
          key={source.page_number}
          title={label}
          src={`${fileUrl}#page=${source.page_number}`}
          className="flex-1"
        />
      )}
    </aside>
  )
}

export default PdfViewer
