# TASK-07: Geração de Atalhos e Templates WhatsApp (wa.me)

## 1. Descrição
Implementação de serviço utilitário para sanitização de números telefônicos e montagem de URLs de link direto `https://wa.me/` com mensagens prontas e contextualizadas para clientes e diaristas.

## 2. Requisitos Atendidos
* [RF09] Atalho de Atendimento via WhatsApp.
* [RN-CLI-02] Integração Operacional com WhatsApp.

## 3. Escopo Técnico
* `WhatsAppLinkService`:
  * Função `formatPhone(rawPhone: string): string`: valida e padroniza para formato internacional (ex.: `5511999998888`).
  * Templates de Mensagens:
    * `generateAppointmentConfirmation(appointment)`: *"Olá {cliente}, confirmamos seu atendimento de {servico} para o dia {data} às {horario}..."*
    * `generateBudgetProposal(appointment)`: *"Olá {cliente}, segue o orçamento do serviço solicitado..."*
    * `generateDiaristaScaleNotice(appointment)`: *"Olá {diarista}, você tem um novo atendimento agendado para {data}..."*
  * Função `buildWhatsAppUrl(phone, templateKey, params): string`.
* Integração dos links nos serializers de resposta da API (payloads de cliente, diarista e atendimento já fornecem as URLs prontas).

## 4. Critérios de Aceitação
* URLs geradas abrem corretamente a conversa no WhatsApp Web ou app oficial com a mensagem pré-preenchida.
* Números inválidos são tratados sem quebrar a serialização do endpoint.
