import { createFileRoute } from "@tanstack/react-router";
import { ChatPage } from "../../../features/chatbot";

export const Route = createFileRoute("/_authenticated/chatbot")({
	component: ChatPage,
});
