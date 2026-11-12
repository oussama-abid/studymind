import { useEffect, useState } from 'react'

type HealthResponse = {
  status: string
  db: 'ok' | 'error'
}

const apiUrl = import.meta.env.VITE_API_URL

function BackendStatus() {
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
    <p className="text-sm">
      Backend: <span className={colors[status]}>{status}</span>
    </p>
  )
}

export default BackendStatus