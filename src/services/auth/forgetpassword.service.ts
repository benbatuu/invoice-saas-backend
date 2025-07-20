import pc from 'helpers/prismaclient.singleton';
import { HTTPException } from 'hono/http-exception';
import { sign as jwtsign } from 'hono/jwt';
import { env } from 'bun';
import HttpStatusCode from 'types/enums/httpstatuses';
import sendemail from '../../helpers/emailsender';

export const forgetPasswordService = async (email: string) => {
	const forgetPassword = await pc.user.findFirst({
		select: { id: true, firstname: true, lastname: true, email: true },
		where: { email: email },
	});

	if (!forgetPassword) throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'invalid_email' });

	const forgetPasswordResponse = {
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000) + parseInt(env.JWT_EXPIRE_MINUTE!) * 60,
		iss: env.JWT_ISS,
		aud: env.JWT_AUD,
		client_id: forgetPassword.id,
		sub: forgetPassword.firstname + ' ' + forgetPassword.lastname,
		sub_id: forgetPassword.id,
		tokentype: env.AUTH_TOKEN_TYPE,
	};

	const token = await jwtsign(forgetPasswordResponse, env.JWT_SECRET!);
	const url = `https://paperworks.gunesimmedya.com//auth/resetpassword?token=${token}`;

	sendemail(url);

	return { message: 'change_password_link_sent_to_your_email' };
};
