import { useEffect, useRef, useState } from 'react'

import { type CourseDocument, fetchDocuments, uploadDocument } from '../api/documents'
import { useToast } from '../toast/ToastContext'

const statusColors = {
  processing: 'bg-yellow-100 text-yellow-800',
  ready: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

function DocumentsSection({ courseId }: { courseId: number }) {
  const [documents, setDocuments] = useState<CourseDocument[]>([])
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const { showToast } = useToast()
  // The last status we showed for each document, to notice when one changes
  const knownStatus = useRef(new Map<number, CourseDocument['status']>())

  const hasProcessing = documents.some((doc) => doc.status === 'processing')

  useEffect(() => {
    fetchDocuments(courseId)
      .then((data) => {
        knownStatus.current = new Map(data.map((doc) => [doc.id, doc.status]))
        setDocuments(data)
        setStatus('ready')
      })
      .catch((error) => {
        console.error('Error loading documents:', error)
        setStatus('error')
      })
  }, [courseId])

  useEffect(() => {
    if (!hasProcessing) return

    const interval = setInterval(() => {
      fetchDocuments(courseId)
        .then((data) => {
          // Tell the user when a document has finished processing
          for (const doc of data) {
            if (knownStatus.current.get(doc.id) !== 'processing') continue
            if (doc.status === 'ready') {
              showToast(`${doc.filename} is ready. You can ask questions about it now.`)
            } else if (doc.status === 'failed') {
              showToast(`${doc.filename} could not be read.`, 'error')
            }
          }
          knownStatus.current = new Map(data.map((doc) => [doc.id, doc.status]))
          setDocuments(data)
        })
        .catch((error) => {
          console.error('Error refreshing documents:', error)
        })
    }, 3000)

    return () => clearInterval(interval)
  }, [courseId, hasProcessing, showToast])

  function openModal() {
    setUploadError(null)
    setIsModalOpen(true)
  }

  async function uploadNewDocument(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const file = formData.get('file') as File

    try {
      const newDocument = await uploadDocument({ course_id: courseId, file })
      knownStatus.current.set(newDocument.id, newDocument.status)
      setDocuments((currentDocuments) => [newDocument, ...currentDocuments])
      setIsModalOpen(false)
      showToast(`${newDocument.filename} uploaded. StudyMind is reading it now.`)
    } catch (error) {
      console.error('Error uploading document:', error)
      setUploadError(error instanceof Error ? error.message : 'Upload failed.')
    }
  }

  return (
    <section className="self-start border-t-2 border-ink pt-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold">Documents</h2>
        <button type="button" onClick={openModal} className="btn-secondary">
          + Upload PDF
        </button>
      </div>

      {status === 'loading' && <p className="text-muted">Loading documents...</p>}

      {status === 'error' && (
        <p className="text-red-600">Could not load the documents. Please try again later.</p>
      )}

      {status === 'ready' && documents.length === 0 && (
        <p className="text-muted">No documents yet. Upload your first PDF!</p>
      )}

      {status === 'ready' && documents.length > 0 && (
        <ul className="flex flex-col">
          {documents.map((doc) => (
            <li key={doc.id} className="animate-enter border-b border-line py-3">
              <div className="flex items-center justify-between gap-4">
                <p className="truncate font-semibold">{doc.filename}</p>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold transition-colors duration-500 ${statusColors[doc.status]}`}
                >
                  {doc.status === 'processing' && (
                    <span
                      aria-hidden="true"
                      className="size-1.5 animate-pulse rounded-full bg-current"
                    />
                  )}
                  {doc.status}
                </span>
              </div>
              {doc.status === 'failed' && doc.error_message && (
                <p className="mt-2 text-sm text-red-600">{doc.error_message}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-title"
            className="card w-full max-w-md animate-enter"
          >
            <h2 id="upload-title" className="mb-4 font-display text-2xl font-bold">
              Upload a PDF
            </h2>
            <form onSubmit={uploadNewDocument} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                PDF file
                <input
                  type="file"
                  name="file"
                  accept="application/pdf"
                  required
                  className="input"
                />
              </label>
              {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn">
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default DocumentsSection
