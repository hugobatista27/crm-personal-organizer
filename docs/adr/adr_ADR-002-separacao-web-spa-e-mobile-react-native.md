# ADR-002: Separação de Clientes em Web SPA (React/Vite) e Mobile App (React Native/Expo)

* **Status:** Aprovado
* **Data:** 2026-11-11
* **Contexto:** Definir a estratégia de experiência do usuário para a Administradora (necessidade de telas densas de gestão, tabelas e calendários) e para as Diaristas (uso operacional em campo no smartphone).

---

## 1. Contexto e Problema

A operação do **Organiza+** possui dois cenários de uso distintos:
* **Administrativo / Backoffice:** A administradora precisa de telas ricas em detalhes (gráficos, calendário mensal com múltiplos filtros, tabelas de conferência financeira e relatórios exportáveis).
* **Operacional em Campo / Mobilidade:** As diaristas precisam de interface rápida no smartphone para conferir a agenda do dia, navegar pelo endereço do cliente e registrar o início/término do trabalho com poucos toques. A administradora também precisa de agilidade mobile para despachar agendamentos por texto enquanto está em trânsito.

## 2. Decisão

Adotamos a divisão em duas aplicações frontend independentes consumindo a mesma API REST:
1. **Web SPA:** Desenvolvido em **React + Vite + Tailwind CSS**. Focado em desktop/notebook e tablets.
2. **Mobile App:** Desenvolvido em **React Native com Expo**. Único app contendo fluxo de telas bifurcado por papel (`ADMIN` vs `DIARISTA`).

### Justificativas:
* **Vite + Tailwind CSS:** Proporciona build ultrarrápido, interface customizável de alta densidade informativa e excelente usabilidade para o painel de controle.
* **React Native / Expo:** Permite compilação para Android/iOS com acesso nativo a mapas e links do WhatsApp, além de simplificar a distribuição e atualização (OTA updates).
* **Reaproveitamento de Conhecimento:** Ambos os frontends utilizam TypeScript e o ecossistema React, permitindo compartilhamento de tipos de domínio e clientes de API.

## 3. Consequências

### Positivas:
* UX otimizada para cada contexto sem comprometer a performance do desktop ou a ergonomia do mobile.
* Diaristas não precisam navegar em painéis densos de ERP; recebem apenas o essencial.

### Negativas / Mitigações:
* Manutenção de dois projetos frontend. Mitigado pelo uso de TypeScript compartilhado e endpoints REST consistentes.
