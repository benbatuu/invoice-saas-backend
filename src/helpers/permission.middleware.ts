import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { decode as jwtdecode } from 'hono/jwt';
import HttpStatusCode from 'types/enums/httpstatuses';
import { env } from 'bun';

const checkPermission = (permissions: Array<string>) => async (c: Context, next: Next) => {
	const accessToken = c.req.header(env.JWT_HEADER_NAME!)!.split(' ')[1];
	const entitlements = (jwtdecode(accessToken).payload?.entitlements || []);
	const cPermissions = [...permissions]; // orijinal array'i bozmamak için kopya
	cPermissions.forEach((permission) => {
		if (!cPermissions.includes(`${permission.split(':')[0]}:*`)) cPermissions.push(`${permission.split(':')[0]}:*`);
	});
	if (!cPermissions.includes('*:*')) cPermissions.push('*:*');

	if (
		cPermissions.some((e) => {
			return entitlements.includes(e);
		})
	)
		await next();
	else throw new HTTPException(HttpStatusCode.UNAUTHORIZED, { message: 'unauthorized' });
};

export default checkPermission;
