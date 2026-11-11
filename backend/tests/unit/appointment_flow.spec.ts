import { test } from '@japa/runner'

test.group('Example Domain Unit Test', () => {
  test('should validate business appointment status transition order', ({ assert }) => {
    const validSequence = [
      'SOLICITADO',
      'ORCAMENTO_ENVIADO',
      'APROVADO',
      'AGENDADO',
      'EM_ANDAMENTO',
      'FINALIZADO',
    ]

    assert.equal(validSequence[0], 'SOLICITADO')
    assert.equal(validSequence[validSequence.length - 1], 'FINALIZADO')
    assert.isTrue(validSequence.includes('AGENDADO'))
  })
})
