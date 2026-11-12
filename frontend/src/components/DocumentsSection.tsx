import { useEffect, useState } from 'react'

import { type CourseDocument, fetchDocuments, uploadDocument } from '../api/documents'

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

  const hasProcessing = documents.some((doc) => doc.status === 'processing')

  useEffect(() => {
    fetchDocuments(courseId)
      .then((data) => {
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
          setDocuments(data)
        })
        .catch((error) => {
          console.error('Error refreshing documents:', error)
        })
    }, 3000)

    return () => clearInterval(interval)
  }, [courseId, hasProcessing])

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
      setDocuments((currentDocuments) => [newDocument, ...currentDocuments])
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error uploading document:', error)
      setUploadError(error instanceof Error ? error.message : 'Upload failed.')
    }
  }

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Documents</h2>
        <button
          type="button"
          onClick={openModal}
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          + Upload PDF
        </button>
      </div>

      {status === 'loading' && <p className="text-gray-500">Loading documents...</p>}

      {status === 'error' && (
        <p className="text-red-600">Could not load the documents. Please try again later.</p>
      )}

      {status === 'ready' && documents.length === 0 && (
        <p className="text-gray-500">No documents yet. Upload your first PDF!</p>
      )}

      {status === 'ready' && documents.length > 0 && (
        <ul className="flex flex-col gap-3">
          {documents.map((doc) => (
            <li key={doc.id} className="rounded-lg bg-white p-4 shadow">
              <div className="flex items-center justify-between gap-4">
                <p className="truncate font-semibold">{doc.filename}</p>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColors[doc.status]}`}
                >
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-title"
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
          >
            <h2 id="upload-title" className="mb-4 text-xl font-bold">
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
                  className="rounded border px-3 py-2"
                />
              </label>
              {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded px-4 py-2 text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                >
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
