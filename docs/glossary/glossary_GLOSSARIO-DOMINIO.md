# Glossário de Domínio: Organiza+

Este documento define os termos de negócio, entidades e conceitos técnicos utilizados no sistema **Organiza+**, garantindo uma linguagem ubíqua entre o negócio, a equipe de produto e de desenvolvimento.

---

## 🏢 1. Negócio e Papéis (Atores)

### RO Organização de Casas e Espaços
Empresa prestadora de serviços residenciais e corporativos especializada em limpeza profissional, passadoria, organização de ambientes (personal organizer), pós-obra, apoio em mudanças e eventos.

### Administradora / Coordenadora
Usuária central do negócio com permissões totais no sistema. Responsável por captar clientes, precificar, designar diaristas, gerenciar faturamento, analisar relatórios e usar o assistente de IA para registrar atendimentos rapidamente via linguagem natural. Possui acesso ao **Painel Web (Vite + React)** e ao **App Mobile (React Native)**.

### Diarista / Prestadora
Profissional parceira ou funcionária da RO responsável pela execução prática dos serviços no local. Acessa o **App Mobile (React Native)** para visualizar sua escala de trabalho, detalhes dos endereços dos clientes, aceitar/confirmar atendimentos e registrar o início/término da execução.

### Cliente
Pessoa física ou jurídica tomadora dos serviços da RO. Não possui login direto no sistema; é cadastrada pela Administradora ou automaticamente criada via extração de dados do chat com a IA.

---

## 📋 2. Ciclo de Atendimento e Operação

### Atendimento / Ordem de Serviço
Unidade fundamental de trabalho da RO. Representa um serviço contratado por um cliente em uma data/horário específicos, atribuído a uma ou mais diaristas.

#### Máquina de Estados do Atendimento:
* **`SOLICITADO`**: Primeiro contato do cliente ou entrada textual registrada no sistema; aguarda formulação de orçamento.
* **`ORCAMENTO_ENVIADO`**: Proposta de preço e escopo transmitida ao cliente via WhatsApp.
* **`APROVADO`**: Cliente confirmou o serviço e o valor; pendente de definição de data/horário ou de alocação de diarista.
* **`AGENDADO`**: Data, horário, endereço, cliente e diarista(s) devidamente vinculados no calendário operacional.
* **`EM_ANDAMENTO`**: Diarista confirmou o início do atendimento no local pelo app mobile.
* **`FINALIZADO`**: Execução concluída pela diarista, pronta para registro de avaliação de qualidade e conciliação financeira.
* **`CANCELADO`**: Atendimento abortado por desistência do cliente ou inviabilidade operacional.

### Conflito de Horário
Regra de validação impeditiva no agendamento: nenhuma diarista pode ter dois atendimentos concomitantes ou com janela de deslocamento sobreposta no mesmo horário.

### Tipo de Serviço
Catálogo parametrizado de serviços ofertados com valor de referência base (ex.: Limpeza Residencial Padrão, Limpeza Pré/Pós-Mudança, Organização de Closets/Armários, Passadoria, Apoio a Eventos).

---

## 🤖 3. Assistente de IA & Chat Operacional

### Chat Operacional de Comandos
Interface de mensageria presente no App Mobile da Administradora permitindo entrada livre em texto de agendamentos e atualizações (ex.: *"Diária agendada com Maria para o dia 10/10 às 8 horas na casa do Carlos"*).

### Pipeline de Extração e Padronização de Entidades (LLM Extraction Engine)
Serviço de backend que consome mensagens de texto via API de LLM para extrair atributos estruturados:
* `cliente` (nome, telefone, endereço)
* `diarista` (identificação ou sugestão por disponibilidade)
* `data` e `horario_inicio` / `horario_fim`
* `tipo_servico`
* `valor_combinado`

### Clarificação Interativa (Slot Filling)
Comportamento da IA quando um dado obrigatório do atendimento não é fornecido pelo usuário. A IA formula uma pergunta direcionada para coletar a informação pendente antes de salvar o registro no banco.

---

## 💰 4. Conceitos Financeiros

### Faturamento Bruto
Soma total dos valores acordados para atendimentos concluídos dentro de um período.

### Repasse / Custo Operacional
Valor destinado à diarista pela diária e custos de deslocamento ou insumos.

### Lucro Operacional Líquido
Diferença entre o Faturamento Bruto e os Custos Operacionais + Despesas Administrativas no período.

### Pagamento Pendente
Status financeiro atribuído a atendimentos concluídos cujo pagamento por parte do cliente ainda não foi identificado e validado pela administradora.
