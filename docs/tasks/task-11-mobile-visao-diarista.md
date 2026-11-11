# TASK-11: Mobile Diarista: Escala, Detalhes e Início/Fim do Serviço

## 1. Descrição
Implementação da interface mobile dedicada para a diarista acompanhar suas escalas de trabalho, visualizar endereço com integração a apps de mapas e registrar o ciclo de execução do atendimento (*Iniciar* e *Finalizar*).

## 2. Requisitos Atendidos
* [RN-MOB-01] Confirmação e Escala da Diarista.
* [RN-MOB-02] Acompanhamento de Execução (Início e Fim).

## 3. Escopo Técnico
* Tela Principal da Diarista:
  * Aba "Hoje": destaque do atendimento do dia atual.
  * Aba "Próximos": lista de atendimentos futuros ordenados cronologicamente.
  * Aba "Concluídos": histórico recente.
* Card do Atendimento:
  * Horário de início e término estimado.
  * Tipo de serviço (ex.: Faxina Pesada, Passadoria) e observações especiais.
  * Nome do cliente e endereço completo.
  * Botão de "Abrir no GPS" (dispara Waze / Google Maps / Apple Maps).
  * Botão de contato rápido via WhatsApp.
* Botões de Ação de Execução:
  * Botão "Confirmar Escala" (confirma ciência prévia).
  * Botão "Iniciar Serviço": altera status do atendimento para `EM_ANDAMENTO` (habilitado no dia do serviço).
  * Botão "Finalizar Serviço": altera status para `FINALIZADO` com confirmação em modal.

## 4. Critérios de Aceitação
* A diarista visualiza exclusivamente os atendimentos associados ao seu cadastro.
* O clique em "Iniciar" e "Finalizar" reflete imediatamente no status do painel web da administradora.
* Integração nativa com apps de mapa abre o endereço exato do cliente com 1 toque.
