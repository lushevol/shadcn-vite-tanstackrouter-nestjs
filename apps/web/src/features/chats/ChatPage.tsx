import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

export function ChatPage() {
  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl font-bold mb-4">Mastra Chat</h1>
      <CopilotKit runtimeUrl="/api/copilotkit">
        <CopilotChat
          labels={{
            title: "Mastra Assistant",
            initial: "Hi! How can I help you today?",
          }}
          instructions="You are the Mastra agent, an AI assistant."
        />
      </CopilotKit>
    </div>
  );
}
