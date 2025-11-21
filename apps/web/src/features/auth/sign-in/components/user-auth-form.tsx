import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { IconFacebook, IconGithub } from "@/assets/brand-icons";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { type LoginRequest, login } from "../api/login";

const formSchema = z.object({
	email: z.email({
		error: (issue) =>
			issue.input === ""
				? "Please enter your email"
				: "Enter a valid email address",
	}),
	password: z.string().min(1, "Please enter your password"),
});

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
	redirectTo?: string;
}

export function UserAuthForm({
	className,
	redirectTo,
	...props
}: UserAuthFormProps) {
	const navigate = useNavigate();
	const { auth } = useAuthStore();

	const form = useForm<LoginRequest>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const loginMutation = useMutation({
		mutationFn: login,
		onSuccess: (data) => {
			auth.setSession({
				accessToken: data.accessToken,
				refreshToken: data.refreshToken,
				refreshExpiresIn: data.refreshExpiresIn,
				user: data.user,
			});
			toast.success(`Welcome back, ${data.user.fullName}!`);

			if (redirectTo && typeof window !== "undefined") {
				const targetUrl = new URL(redirectTo, window.location.origin);
				const searchParams = Object.fromEntries(
					targetUrl.searchParams.entries(),
				);
				navigate({
					to: targetUrl.pathname as never,
					search: searchParams as never,
					replace: true,
				});
				return;
			}

			navigate({ to: "/", replace: true });
		},
	});

	const onSubmit = (values: LoginRequest) => {
		loginMutation.mutate(values);
	};

	const isLoading = loginMutation.isPending;

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className={cn("grid gap-3", className)}
				{...props}
			>
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input
									autoComplete="email"
									placeholder="name@example.com"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem className="relative">
							<FormLabel>Password</FormLabel>
							<FormControl>
								<PasswordInput
									autoComplete="current-password"
									placeholder="********"
									{...field}
								/>
							</FormControl>
							<FormMessage />
							<Link
								to="/forgot-password"
								className="text-muted-foreground absolute -top-0.5 end-0 text-sm font-medium hover:opacity-75"
							>
								Forgot password?
							</Link>
						</FormItem>
					)}
				/>
				<Button className="mt-2" disabled={isLoading}>
					{isLoading ? <Loader2 className="animate-spin" /> : <LogIn />}
					Sign in
				</Button>

				<div className="relative my-2">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background text-muted-foreground px-2">
							Or continue with
						</span>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2">
					<Button variant="outline" type="button" disabled={isLoading}>
						<IconGithub className="h-4 w-4" /> GitHub
					</Button>
					<Button variant="outline" type="button" disabled={isLoading}>
						<IconFacebook className="h-4 w-4" /> Facebook
					</Button>
				</div>
			</form>
		</Form>
	);
}
