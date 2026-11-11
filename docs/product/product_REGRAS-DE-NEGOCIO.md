# Regras de Negócio: Organiza+

Este documento consolida as políticas, invariantes e fluxos de negócio que regem o sistema **Organiza+**.

---

## 1. Gestão de Atendimentos e Ciclo de Vida

### RN-AT-01: Sequenciamento Obrigatório de Estados
O ciclo de vida do atendimento deve obedecer estritamente a sequência:
`SOLICITADO` ➔ `ORCAMENTO_ENVIADO` ➔ `APROVADO` ➔ `AGENDADO` ➔ `EM_ANDAMENTO` ➔ `FINALIZADO`.
* Um atendimento só pode transicionar para `AGENDADO` se houver pelo menos uma Diarista vinculada e horário definido.
* Um atendimento pode transicionar para `CANCELADO` a partir de qualquer estado anterior a `FINALIZADO`.
* Todo avanço ou regressão de estado deve gravar registro de auditoria com carimbo de data, hora e autor da ação.

### RN-AT-02: Prevenção de Conflito de Horário de Diaristas
* Nenhuma diarista com status `Ativa` pode ser alocada para dois atendimentos cujo intervalo de tempo coincida no mesmo dia.
* Ao tentar salvar um agendamento com conflito, o sistema deve rejeitar a operação e listar os horários conflitantes.

### RN-AT-03: Alocação e Especialidade
* No momento da atribuição da diarista ao serviço, o sistema deve alertar a administradora caso o tipo de serviço selecionado não conste nas especialidades cadastradas da profissional, embora a administradora possa confirmar por discricionariedade.

---

## 2. Operação Mobile da Diarista

### RN-MOB-01: Confirmação e Escala
* A diarista visualiza exclusivamente sua própria agenda de atendimentos.
* Quando um atendimento é atribuído a ela no estado `AGENDADO`, ela pode confirmar ciência via app.
* A diarista não tem permissão para alterar valores, custos ou dados contratuais do cliente.

### RN-MOB-02: Acompanhamento de Execução (Início e Fim)
* A diarista só pode acionar o botão **"Iniciar Atendimento"** (`EM_ANDAMENTO`) no dia agendado do serviço.
* Ao concluir a tarefa, a diarista aciona **"Finalizar Atendimento"** (`FINALIZADO`), notificando o sistema para liberação da avaliação de qualidade e conciliação financeira.

---

## 3. Assistente de IA / Chat Operacional

### RN-IA-01: Extração e Padronização de Comandos Textuais
* O texto livre enviado pela administradora (ex.: *"Agendar faxina na casa de Dona Ana dia 15/11 às 9h com a Carla"*) deve ser processado pela engine de LLM para extração de entidades:
  * Cliente: nome/telefone
  * Diarista: nome
  * Data e Hora
  * Tipo de Serviço
  * Valor
* Se o cliente ou diarista mencionados não existirem exatamente no banco de dados, o sistema deve tentar fuzzy matching ou sugerir a criação rápida.

### RN-IA-02: Slot Filling / Perguntas de Esclarecimento
* Se um parâmetro essencial (Data, Horário, Cliente ou Serviço) estiver ausente na mensagem, a IA **não** deve persistir o agendamento de forma incompleta.
* Em vez disso, a IA responderá no chat solicitando a informação pendente (ex.: *"Identifiquei a faxina com Carla para 15/11, mas qual é o horário de início?"*).

### RN-IA-03: Confirmação Pré-Persistência
* Após coletar todos os dados, a IA devolve um card estruturado com a síntese do agendamento para validação com 1 toque da Administradora antes do commit final no banco de dados.

---

## 4. Clientes e Comunicação

### RN-CLI-01: Unicidade e Validação
* O número de telefone celular com DDD é o identificador único primário para comunicação rápida.
* Não são permitidos clientes duplicados com o mesmo telefone celular.

### RN-CLI-02: Integração Operacional com WhatsApp
* Em todas as telas e fichas de cliente, atendimento ou diarista, haverá um link no padrão `https://wa.me/<numero>?text=<mensagem_formatada>` que abre diretamente o aplicativo oficial do WhatsApp com a mensagem contextualizada.

---

## 5. Financeiro e Qualidade

### RN-FIN-01: Fechamento e Lucro
* Para cada atendimento finalizado, o Lucro Líquido é calculado por:
  $$\text{Lucro} = \text{Valor Cobrado do Cliente} - (\text{Repasse Diarista} + \text{Custos Adicionais})$$
* Pagamentos não confirmados pela administradora permanecem com flag de `Pagamento Pendente`, gerando alerta no Dashboard.

### RN-QUA-01: Avaliação de Atendimento
* Após a finalização do serviço, a administradora registra nota de 1 a 5 estrelas e observações qualitativas.
* A média histórica da diarista é recalculada incrementalmente e exposta em seu perfil e na listagem geral.
