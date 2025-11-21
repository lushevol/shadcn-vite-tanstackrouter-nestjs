import { createFileRoute } from "@tanstack/react-router";
import { ChatPage } from "../../../features/chats/ChatPage";

export const Route = createFileRoute("/_authenticated/mastra")({
	component: ChatPage,
});
