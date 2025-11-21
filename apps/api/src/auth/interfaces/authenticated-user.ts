export interface AuthenticatedUser {
	id: number;
	email: string;
	fullName: string;
	accountNumber: string;
	roles: string[];
}
