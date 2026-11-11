# TASK-10: Fundação App Mobile React Native (Expo, Auth e RBAC)

## 1. Descrição
Configuração inicial do aplicativo mobile multiplataforma em React Native com Expo, navegação nativa e redirecionamento de tela baseado no papel do usuário autenticado (`ADMIN` vs `DIARISTA`).

## 2. Requisitos Atendidos
* [ADR-002] Separação de Clientes em Web SPA e Mobile App React Native.
* [RNF01] Autenticação e Segurança.

## 3. Escopo Técnico
* Inicializar projeto Expo com TypeScript (`npx create-expo-app`).
* Configurar Tailwind/NativeWind para estilização ágil.
* Configurar React Navigation com Native Stack e Bottom Tabs.
* Configurar armazenamento seguro de token (`expo-secure-store`).
* Tela de Login Mobile:
  * Autenticação via API AdonisJS (`/api/v1/auth/login`).
  * Identificação do papel retornado (`role`).
* Roteador de Redirecionamento Pós-Login:
  * Se `role === 'DIARISTA'` ➔ Redireciona para o Stack de Diarista (Escala, Atendimentos).
  * Se `role === 'ADMIN'` ➔ Redireciona para o Stack da Administradora (Chat IA, Resumo Rápido).
* Tratamento de logout e renovação de sessão expirada.

## 4. Critérios de Aceitação
* App compila e roda tanto em iOS quanto em Android (via Expo Go / Dev Client).
* Login de diarista abre diretamente a tela operacional da profissional.
* Login de administradora abre o ambiente com aba do assistente de IA.
