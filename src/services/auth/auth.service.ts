import pc from 'helpers/prismaclient.singleton';
import { HTTPException } from 'hono/http-exception';
import { sign as jwtsign } from 'hono/jwt';
import { env } from 'bun';
import HttpStatusCode from 'types/enums/httpstatuses';

export const authorizeService = async (key: string, secret: string) => {
	const client = await pc.apiclient.findFirst({
		where: {
			key: key,
			secret: secret,
		},
	});

	if (!client) throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'invalid_client_or_secret_key' });

	if (!client.isactive) throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'client_is_not_active' });

	const authResponse = {
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000) + parseInt(env.JWT_EXPIRE_MINUTE!) * 60,
		iss: env.JWT_ISS,
		aud: env.JWT_AUD,
		client_id: client.id,
		sub: client.name,
		sub_id: client.id,
		tokentype: env.AUTH_TOKEN_TYPE,
	};
	const token = await jwtsign(authResponse, process.env.JWT_SECRET!);

	return { access_token: token, token_type: env.JWT_TOKEN_TYPE, expires_in: authResponse.exp };
};
