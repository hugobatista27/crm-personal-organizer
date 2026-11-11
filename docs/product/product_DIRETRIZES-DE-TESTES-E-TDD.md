# Diretrizes de Engenharia: TDD Obrigatório e Testes Rígidos

> [!IMPORTANT]
> **POLÍTICA MANDATÓRIA DO PROJETO ORGANIZA+:**  
> O desenvolvimento de qualquer funcionalidade, correção de bug ou refatoração no ecossistema (Backend, Frontend Web e Mobile App) **deve impreterivelmente seguir a metodologia TDD (Test-Driven Development)**. Nenhum código de produção deve ser commitado ou integrado sem os testes correspondentes escritos e aprovados.

---

## 1. O Ciclo TDD (Red - Green - Refactor)

Todo desenvolvedor e agente deve seguir estritamente o ciclo de três fases:

1. 🔴 **RED (Escreva o teste primeiro):**
   * Escreva um teste automatizado antes de qualquer implementação de código.
   * Execute o teste e certifique-se de que ele **falha pelo motivo correto** (ex.: classe ou método inexistente, assert não atendido).
2. 🟢 **GREEN (Implementação mínima):**
   * Escreva o código estritamente necessário para fazer o teste passar.
   * Não adicione lógica extra sem um teste que a justifique.
3. 🔵 **REFACTOR (Limpeza e qualidade):**
   * Melhore a legibilidade, remova duplicidades e respeite as convenções de código mantendo todos os testes em verde.

---

## 2. Pilhas e Ambientes de Teste

| Projeto | Framework / Ferramenta | Runner / Config | Comando de Execução |
| :--- | :--- | :--- | :--- |
| **Backend** | **Japa** (@japa/runner + AdonisJS Test Utils) | `adonisrc.ts` / `tests/bootstrap.ts` | `npm test` (ou `node ace test`) |
| **Frontend Web** | **Vitest** + React Testing Library + jest-dom | `vite.config.ts` (jsdom) | `npm test` (ou `npm run test:watch`) |
| **Mobile App** | **Jest** + React Native Testing Library | `jest.config.js` | `npm test` |

---

## 3. Critérios de Rastreabilidade e Cobertura Rígida

1. **Regras de Negócio e Estados:**
   * A máquina de estados de atendimentos (`SOLICITADO` ➔ `FINALIZADO`) e as restrições de conflito de agenda de diaristas exigem testes unitários exaustivos com cobertura de borda (datas coincidentes, limites de horário, transições inválidas).
2. **APIs e Endpoints:**
   * Todo endpoint novo deve contar com testes funcionais verificando:
     * Código HTTP de sucesso (200, 201).
     * Validação de payload inválido (422 com mensagens amigáveis).
     * Permissões de RBAC (401 para não autenticado, 403 para diarista acessando rota admin).
3. **Componentes de UI:**
   * Devem ser testados quanto ao comportamento acessível (botões clicáveis, formulários emitindo eventos corretos, feedback visual de carregamento e erro).
4. **Assistente de IA:**
   * O pipeline de extração de dados e *slot-filling* deve ter testes com fixtures de mensagens reais simulando casos completos e incompletos.

---

## 4. Comandos de Validação Rápida

Para verificar a saúde dos testes em cada projeto:

```bash
# 1. No backend (AdonisJS v6)
cd backend && npm test

# 2. No frontend web (React + Vite)
cd frontend-web && npm test

# 3. No mobile (React Native / Expo)
cd mobile-app && npm test
```

> [!WARNING]
> Pull Requests ou commits que alterem lógica de domínio sem testes ou com testes falhando serão rejeitados na esteira de integração.
