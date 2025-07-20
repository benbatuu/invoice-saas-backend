import pc from 'helpers/prismaclient.singleton';
import { HTTPException } from 'hono/http-exception';
import { sign as jwtsign } from 'hono/jwt';
import { env } from 'bun';
import HttpStatusCode from 'types/enums/httpstatuses';

export const resetPasswordService = async (password: string, verifypassword: string, token: string, email: string) => {
	const resetPassword = await pc.user.findFirst({
		select: {
			id: true,
			firstname: true,
			lastname: true,
			email: true,
		},
		where: {
			email: email,
		},
	});

	if (!resetPassword) throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'invalid_client_or_secret_key' });

	const authResponse = {
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000) + parseInt(env.JWT_EXPIRE_MINUTE!) * 60,
		iss: env.JWT_ISS,
		aud: env.JWT_AUD,
		client_id: resetPassword.id,
		sub: resetPassword.firstname + ' ' + resetPassword.lastname,
		sub_id: resetPassword.id,
		tokentype: env.AUTH_TOKEN_TYPE,
	};

	const myToken = await jwtsign(authResponse, env.JWT_SECRET!);

	if (token != myToken) throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'invalid_token_or_token_is_expired' });

	if (password !== verifypassword) throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'password_and_verify_password_not_match' });

	await pc.user.update({
		where: {
			id: resetPassword.id,
		},
		data: {
			password: password,
			updatedat: new Date(),
		},
	});

	return { message: 'password_changed' };
};
