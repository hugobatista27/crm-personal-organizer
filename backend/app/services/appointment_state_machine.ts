import type { AppointmentStatus } from '#models/appointment'

const nextStatus: Partial<Record<AppointmentStatus, AppointmentStatus>> = {
  SOLICITADO: 'ORCAMENTO_ENVIADO',
  ORCAMENTO_ENVIADO: 'APROVADO',
  APROVADO: 'AGENDADO',
  AGENDADO: 'EM_ANDAMENTO',
  EM_ANDAMENTO: 'FINALIZADO',
}

export default class AppointmentStateMachine {
  canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
    if (to === 'CANCELADO') return from !== 'FINALIZADO' && from !== 'CANCELADO'
    return nextStatus[from] === to
  }
}
