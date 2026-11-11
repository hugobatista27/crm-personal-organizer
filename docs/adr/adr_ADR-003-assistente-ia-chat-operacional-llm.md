# ADR-003: Assistente Operacional por LLM com Extração Estruturada e Slot-Filling

* **Status:** Aprovado
* **Data:** 2026-11-11
* **Contexto:** Viabilizar entrada rápida de agendamentos em linguagem natural pela administradora através de um chat no App Mobile.

---

## 1. Contexto e Problema

No dia a dia da administradora, muitos agendamentos chegam via áudio ou mensagens fragmentadas no WhatsApp. Preencher manualmente formulários com múltiplos campos (cliente, diarista, data, horário, endereço, tipo de serviço, valor) enquanto está na rua é moroso e propenso a erros. Ela precisa de uma forma de simplesmente digitar comandos livres (ex.: *"Diária agendada com Maria para o dia 10/10 às 8 horas"*) e ter os dados convertidos em agendamentos válidos.

## 2. Decisão

Implementar um módulo de assistência por inteligência artificial (**AiChatModule**) no backend que utiliza uma API de LLM comercial (OpenAI / Claude / Gemini) com suporte a **Structured Outputs / JSON Schema** e diálogo interativo de preenchimento de lacunas (*slot-filling*).

### Arquitetura do Fluxo:
1. **Entrada:** A administradora digita a mensagem no chat mobile.
2. **Parsing & Extração:** O backend injeta o prompt de sistema com as entidades disponíveis (lista de diaristas ativas, tipos de serviço) e solicita ao modelo a extração em formato JSON estrito:
   ```json
   {
     "intent": "CREATE_APPOINTMENT",
     "entities": {
       "client_name": "Maria",
       "date": "2026-10-10",
       "start_time": "08:00",
       "service_type": null,
       "diarista_name": null
     },
     "missing_fields": ["service_type", "diarista_name"]
   }
   ```
3. **Validação & Slot-Filling:** Se faltarem campos obrigatórios ou houver ambiguidade, o backend formula uma pergunta de esclarecimento e mantém o estado da sessão de chat em cache/banco.
4. **Card de Confirmação:** Quando todos os dados estiverem preenchidos, a IA retorna um card estruturado para a tela do app mobile com o botão "Confirmar e Agendar".
5. **Commit:** Com o clique de confirmação, o backend executa as validações de concorrência e persiste o registro no PostgreSQL.

## 3. Consequências

### Positivas:
* Redução drástica do tempo gasto pela administradora para cadastrar atendimentos.
* Eliminação de agendamentos com dados incompletos ou datas mal formatadas.
* Baixo acoplamento: o modelo de IA pode ser trocado ou atualizado sem impacto no banco de dados.

### Negativas / Mitigações:
* Custo por chamada de API de IA: mitigado pelo uso de modelos leves e rápidos (como GPT-4o-mini ou Gemini Flash) e prompts concisos com cache.
* Dependência de conectividade externa: o app mantém sempre a opção de agendamento manual tradicional por formulário.
