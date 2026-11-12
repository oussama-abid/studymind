import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Remove everything rendered by a test before the next test starts
afterEach(() => {
  cleanup()
})