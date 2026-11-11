# TASK-05: Engine de IA: Parsing de Mensagens, LLM e Slot-Filling

## 1. Descrição
Implementação do serviço backend para processamento de linguagem natural do chat operacional da administradora. Utiliza LLM com saída estruturada (JSON) para extrair dados de agendamentos e orquestrar perguntas de esclarecimento (*slot-filling*).

## 2. Requisitos Atendidos
* [ADR-003] Assistente Operacional por LLM com Extração Estruturada e Slot-Filling.
* [RN-IA-01, RN-IA-02, RN-IA-03] Regras de negócio da IA.

## 3. Escopo Técnico
* Configuração do provedor de LLM (OpenAI API / Claude API / Gemini via adapter unificado em `src/services/AiService.ts`).
* Definição de JSON Schema estrito para extração de dados:
  * `client_name`: string ou null
  * `client_phone`: string ou null
  * `diarista_name`: string ou null
  * `service_type_name`: string ou null
  * `date`: string (YYYY-MM-DD) ou null
  * `start_time`: string (HH:mm) ou null
  * `price`: number ou null
  * `is_complete`: boolean
  * `missing_fields`: array de strings
  * `follow_up_question`: string (se faltar algum campo obrigatório)
* Criação de tabela de sessão de chat `AiChatSession` e `AiChatMessage`:
  * Permite manter o contexto do diálogo da administradora durante as rodadas de perguntas e respostas.
* Endpoint `POST /api/v1/ai/chat/message`:
  * Recebe o texto digitado pela administradora.
  * Executa o parser da LLM injetando os nomes das diaristas ativas e tipos de serviço como contexto dinâmico.
  * Retorna ou uma pergunta de esclarecimento (texto) ou o card estruturado pronto para confirmação.
* Endpoint `POST /api/v1/ai/chat/confirm`:
  * Recebe o payload estruturado validado e persiste o agendamento no banco.

## 4. Critérios de Aceitação
* Frases como *"Diária agendada com Maria para o dia 10/10 as 8 horas"* extraem data, hora e nome com sucesso.
* Faltando informações cruciais (ex.: endereço ou serviço), a IA formula pergunta amigável em português.
* O agendamento só é commitado no banco após a confirmação explícita da administradora.
