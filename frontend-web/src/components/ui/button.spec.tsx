import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('should render button with text correctly', () => {
    render(<Button>Confirmar Agendamento</Button>)
    expect(screen.getByRole('button', { name: /confirmar agendamento/i })).toBeInTheDocument()
  })

  it('should apply variant classes correctly', () => {
    render(<Button variant="destructive">Cancelar</Button>)
    const button = screen.getByRole('button', { name: /cancelar/i })
    expect(button.className).toContain('bg-red-600')
  })
})
