export interface JwtPayload {
	sub: number;
	email: string;
	roles: string[];
	accountNumber: string;
	fullName: string;
}
