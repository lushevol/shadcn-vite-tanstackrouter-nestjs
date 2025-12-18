# Agents Guide (Web)

## Project Overview
`apps/web` is the frontend application for the platform, built as a modern Single Page Application (SPA).
- **Type**: React 19 + Vite Monorepo Application
- **Role**: Admin Dashboard / User Interface
- **State Management**: Zustand, React Query
- **Routing**: TanStack Router (File-system based)
- **Styling**: TailwindCSS v4, Shadcn/UI (Radix Primitives)

## AI & Agents Integration
This project integrates AI capabilities using **CopilotKit** and **Assistant UI**.

### Architecture
- **Runtime**: `@copilotkit/react-core` manages the agent state and connection.
- **UI Framework**: `@assistant-ui/react` provides the chat interface primitives.
- **Backend Endpoint**: The CopilotKit runtime connects to `/api/copilotkit`.

### Key Components
- **Chat Interface**: Located in `src/features/chats/ChatPage.tsx`.
    - Defines the `Mastra Agent` with instructions.
    - Uses `<CopilotKit>` provider and `<CopilotChat>` UI.
- **Custom UI Components**: `src/components/assistant-ui/`
    - `thread.tsx`: Main chat thread implementation customizations.
    - `attachment.tsx`: Handling file attachments in chat.
    - `markdown-text.tsx`: Rendering markdown responses.
    - `tool-fallback.tsx`: Fallback UI for tool calls.

### Developer Guidelines
1.  **Adding Features**: Feature-specific code lives in `src/features/`.
2.  **Modifying Chat UI**: Edit components in `src/components/assistant-ui/` to change the look and feel of the agent.
3.  **Agent Configuration**: Update `ChatPage.tsx` to modify system instructions or initial labels.
4.  **Routing**: Add new routes in `src/routes/`. Do not edit `routeTree.gen.ts` manually.

## Technology Stack
- **Framework**: React 19, Vite
- **Language**: TypeScript
- **UI Library**: Shadcn UI (Radix), Lucide Icons
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: TanStack Router
- **Forms**: React Hook Form + Zod
- **AI/LLM**: CopilotKit, Assistant UI
