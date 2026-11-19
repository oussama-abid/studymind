import { useEffect } from 'react'

// Sets the browser tab title; screen readers also read it when a page opens
export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · StudyMind`
  }, [title])
}
