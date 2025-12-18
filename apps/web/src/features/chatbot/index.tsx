import "@copilotkit/react-ui/styles.css";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
	AssistantChatTransport,
	useChatRuntime,
} from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";

export function ChatPage() {
	const runtime = useChatRuntime({
		transport: new AssistantChatTransport({
			api: "/api/chat",
		}),
	});
	return (
		<div className="flex flex-col h-full">
			<h1 className="text-2xl font-bold mb-4">chatbot</h1>
			<AssistantRuntimeProvider runtime={runtime}>
				<Thread />
			</AssistantRuntimeProvider>
		</div>
	);
}
