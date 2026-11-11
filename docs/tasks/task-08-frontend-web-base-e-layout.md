# TASK-08: Fundação Frontend Web (React + Vite + Tailwind + Auth)

## 1. Descrição
Criação e estruturação da aplicação Web SPA para a administradora, utilizando React, Vite, Tailwind CSS, roteamento protegido e gerenciamento de estado de autenticação via token JWT.

## 2. Requisitos Atendidos
* [RNF03] Responsividade otimizada para desktop/notebook e tablet.
* [RNF06] Usabilidade: layout com menu lateral fixo.

## 3. Escopo Técnico
* Inicializar projeto com Vite + React + TypeScript.
* Configurar Tailwind CSS e componentes de base (Lucide Icons, botões, modais, inputs padronizados).
* Configurar `react-router-dom` com layout administrativo mestre:
  * Sidebar fixa com navegação para Dashboard, Clientes, Diaristas, Serviços, Agenda, Financeiro, Relatórios e Configurações.
  * Botão fixo no menu lateral de atalho para WhatsApp da empresa.
  * Header com perfil do usuário logado e sino de notificações.
* Configurar cliente HTTP (Axios / Fetch wrapper com interceptor de Bearer token).
* Tela de Login (`/login`) com validação e armazenamento seguro de token no `localStorage` ou cookies seguros.
* Configuração do TanStack Query (`@tanstack/react-query`) para caching e sincronização de dados com a API.

## 4. Critérios de Aceitação
* Usuário deslogado é redirecionado para `/login`.
* Navegação fluida entre rotas protegidas sem recarregamento da página.
* Layout responsivo e visualmente alinhado aos padrões modernos de CRM/ERP.
