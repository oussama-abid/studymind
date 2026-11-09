import { useEffect, useState } from 'react'

type HealthResponse = {
  status: string
  db: 'ok' | 'error'
}

const apiUrl = import.meta.env.VITE_API_URL

function App() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    fetch(`${apiUrl}/health`)
      .then((response) => response.json() as Promise<HealthResponse>)
      .then((data) => setStatus(data.status === 'ok' ? 'online' : 'offline'))
      .catch((error) => {
        console.error('Error fetching backend status:', error)
        setStatus('offline')
      })
  }, [])

  const colors = {
    checking: 'text-gray-500',
    online: 'text-green-600',
    offline: 'text-red-600',
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-6 shadow-md">
        <h1 className="text-xl font-bold text-blue-600">StudyMind</h1>
        <p>
          Backend: <span className={colors[status]}>{status}</span>
        </p>
      </div>
    </main>
  )
}

export default App