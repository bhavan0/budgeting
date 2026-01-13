import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  it('renders the welcome title', () => {
    render(<App />)
    expect(screen.getByText(/Welcome to/)).toBeInTheDocument()
  })

  it('renders the test connection button', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /Test Connection/i })).toBeInTheDocument()
  })

  it('renders the tech badges', () => {
    render(<App />)
    expect(screen.getByText('React 19')).toBeInTheDocument()
    expect(screen.getByText('.NET 10')).toBeInTheDocument()
    expect(screen.getByText('Tailwind CSS')).toBeInTheDocument()
  })
})
