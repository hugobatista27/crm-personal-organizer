# TASK-12: Mobile Admin: Interface de Chat Operacional com Assistente IA

## 1. Descrição
Implementação da interface móvel de chat para a administradora, permitindo enviar comandos textuais em linguagem natural para que a IA padronize e pré-preencha agendamentos no banco de dados.

## 2. Requisitos Atendidos
* [ADR-003] Assistente Operacional por LLM com Extração Estruturada e Slot-Filling.
* [RN-IA-01, RN-IA-02, RN-IA-03] Regras de negócio da IA.

## 3. Escopo Técnico
* Tela de Chat Conversacional (estilo mensageria WhatsApp/Telegram):
  * Lista de mensagens (balões do usuário e balões da IA).
  * Input de texto com botão de envio.
  * Indicador de digitação/processamento animado da IA.
* Renderização de Cards Estruturados (Interactive Cards):
  * Quando a IA extrai todos os dados com sucesso, renderiza um card especial no meio do chat:
    * Cliente: Nome e Telefone
    * Diarista Alocada
    * Data e Horário
    * Serviço e Valor
    * Botão destacado: **"Confirmar e Salvar Agendamento"**.
    * Botão secundário: **"Ajustar Informações"**.
* Fluxo de Perguntas de Esclarecimento (Slot-Filling):
  * Quando faltar informação, a IA responde em texto normal perguntando o dado pendente (ex.: *"Qual será o horário de início para o atendimento da Maria no dia 10/10?"*).
  * A resposta seguinte da administradora complementa o estado da sessão.
* Integração com os endpoints `POST /api/v1/ai/chat/message` e `POST /api/v1/ai/chat/confirm`.

## 4. Critérios de Aceitação
* Ao digitar uma frase informal de agendamento, o card estruturado é exibido com os dados extraídos.
* Ao clicar em "Confirmar e Salvar", o atendimento é registrado no banco e a IA exibe mensagem de sucesso com link para ver na agenda.
* Se faltar algum dado essencial, o diálogo ocorre de maneira natural até o preenchimento completo.
