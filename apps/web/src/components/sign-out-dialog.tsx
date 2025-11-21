import { useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { logout } from "@/features/auth/api/logout";
import { useAuthStore } from "@/stores/auth-store";

interface SignOutDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
	const navigate = useNavigate();
	const location = useLocation();
	const { auth } = useAuthStore();

	const logoutMutation = useMutation({
		mutationFn: async () => {
			const refreshToken = auth.getRefreshToken();
			if (!refreshToken) return;
			await logout(refreshToken);
		},
		onSuccess: () => {
			toast.success("Signed out successfully");
		},
		onError: () => {
			toast.error("We signed you out locally, but the server logout failed.");
		},
		onSettled: () => {
			auth.reset();
			const currentPath = location.href;
			navigate({
				to: "/sign-in",
				search: { redirect: currentPath },
				replace: true,
			});
			onOpenChange(false);
		},
	});

	const handleSignOut = () => {
		logoutMutation.mutate();
	};

	return (
		<ConfirmDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Sign out"
			desc="Are you sure you want to sign out? You will need to sign in again to access your account."
			confirmText="Sign out"
			handleConfirm={handleSignOut}
			isLoading={logoutMutation.isPending}
			className="sm:max-w-sm"
		/>
	);
}
