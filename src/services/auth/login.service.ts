import pc from 'helpers/prismaclient.singleton';
import { HTTPException } from 'hono/http-exception';
import { sign as jwtsign } from 'hono/jwt';
import { env } from 'bun';
import { generateRefreshToken } from 'helpers/helpers';
import HttpStatusCode from 'types/enums/httpstatuses';

export const loginService = async (apiclientid: number, email: string | undefined, password: string | undefined, refreshtoken: string | undefined) => {
	var existingRefreshToken: any = undefined;
	if (refreshtoken) {
		existingRefreshToken = await pc.refreshtoken.findFirst({
			where: {
				token: refreshtoken,
			},
		});

		if (!existingRefreshToken) throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'invalid_refreshtoken' });

		if (new Date(existingRefreshToken.expiresat!) < new Date()) throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'invalid_refreshtoken' });
	}
	const user = await pc.user.findFirst({
		select: {
			id: true,
			firstname: true,
			lastname: true,
			email: true,
			phone: true,
			status: true,
			userpermissions: {
				select: {
					permission: {
						select: {
							value: true,
						},
					},
				},
			},
			userroles: {
				select: {
					role: {
						select: {
							name: true,
							rolepermissions: {
								select: {
									permission: {
										select: {
											value: true,
										},
									},
								},
							},
						},
					},
				},
			},
		},
		where: { ...(refreshtoken ? { id: existingRefreshToken.userid } : { email: email, password: password }) },
	});

	if (!user) throw new HTTPException(400, { message: 'invalid_email_or_password' });
	if (!user.status) throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'user_is_not_active' });

	const permissions: string[] = [];

	user?.userpermissions.forEach((permission) => {
		if (permissions.indexOf(permission.permission.value) === -1) permissions.push(permission.permission.value);
	});

	user?.userroles.forEach((role) => {
		role.role.rolepermissions.forEach((permission) => {
			if (permissions.indexOf(permission.permission.value) === -1) permissions.push(permission.permission.value);
		});
	});

	var newRefreshToken = generateRefreshToken(user.id);

	if (refreshtoken) {
		await pc.refreshtoken.update({
			where: {
				id: existingRefreshToken.id,
			},
			data: {
				token: newRefreshToken,
				expiresat: new Date(Date.now() + parseInt(env.REFRESH_TOKEN_EXPIRE_MINUTE!) * 60 * 1000).toISOString(),
			},
		});
	} else {
		await pc.refreshtoken.create({
			data: {
				token: newRefreshToken,
				userid: user.id,
				expiresat: new Date(Date.now() + parseInt(env.REFRESH_TOKEN_EXPIRE_MINUTE!) * 60 * 1000).toISOString(),
			},
		});
	}

	const jwtPayload = {
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000) + parseInt(env.JWT_EXPIRE_MINUTE!) * 60,
		iss: env.JWT_ISS,
		aud: env.JTW_AUD,
		client_id: apiclientid,
		sub: user?.email,
		sub_id: user?.id,
		phone: user?.phone,
		given_name: user?.firstname,
		family_name: user?.lastname,
		entitlements: permissions,
		roles: user?.userroles.map((role) => role.role.name),
		tokentype: env.LOGIN_TOKEN_TYPE,
	};
	var logintoken = await jwtsign(jwtPayload, env.JWT_SECRET!);

	return { accesstoken: logintoken, tokentype: env.JWT_TOKEN_TYPE, refreshtoken: newRefreshToken, expiresin: jwtPayload.exp };
};
