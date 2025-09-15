import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock global gtag function for tests
global.gtag = vi.fn()