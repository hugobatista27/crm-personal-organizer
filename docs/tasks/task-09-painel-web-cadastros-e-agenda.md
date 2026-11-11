# TASK-09: Painel Web: Telas de Clientes, Diaristas e Calendário

## 1. Descrição
Implementação das páginas de gerenciamento de cadastros de clientes e diaristas, modal de detalhes do atendimento e visualizador completo de agenda interativa no painel web.

## 2. Requisitos Atendidos
* [RF02] Cadastro e Consulta de Clientes.
* [RF03] Cadastro e Listagem de Diaristas.
* [RF06] Abertura e Acompanhamento de Atendimentos.
* [RF07] Visualização da Agenda.

## 3. Escopo Técnico
* Tela de Clientes (`/clientes`):
  * Tabela com busca, paginação, modal de novo/editar cliente, link para mapa do endereço e botão com link direto de WhatsApp.
  * Drawer lateral com histórico de serviços do cliente.
* Tela de Diaristas (`/diaristas`):
  * Grid ou tabela com foto, status (badge colorida), especialidades (chips) e estrelas de avaliação média.
  * Modal de cadastro/edição e página de perfil com histórico de serviços prestados.
* Tela de Agenda (`/agenda`):
  * Alternância de visualização: Dia, Semana e Mês.
  * Navegação temporal (Anterior, Próximo, Hoje).
  * Renderização de blocos de atendimento com código de cores por status/serviço.
  * Clique no bloco abre modal/drawer com linha do tempo de status (RF06), ações rápidas (reagendar, cancelar, trocar diarista) e botão de WhatsApp.
  * Botão de "Novo Atendimento" com verificação inline de conflitos de horário.

## 4. Critérios de Aceitação
* Ações de cadastro refletem em tempo real na tabela e na agenda sem refresh de página.
* Conflitos de horário são exibidos com alerta visual no momento do agendamento.
* A linha do tempo do atendimento exibe o histórico com data/hora e autor.
