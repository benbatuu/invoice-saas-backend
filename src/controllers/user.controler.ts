import { Context, Hono, Next } from 'hono';
import { env } from 'bun';
import { verify as jwtverify, decode as jwtdecode } from 'hono/jwt';
import { getAllUsers } from 'services/user/getall.service';
import { getUserById } from 'services/user/get.service';
import { createService } from 'services/user/create.service';
import { editService } from 'services/user/edit.service';
import { archiveService } from 'services/user/archive.service';
import { activateService } from 'services/user/activate.service';
import { editUserInfoService } from 'services/user/edituserinfo.service';
import { profileService } from 'services/user/profile.service';
import checkPermission from 'helpers/permission.middleware';

const userController = new Hono();

userController.get('/', checkPermission(['user:view']), async (c) => {
	const token = c.req.header(env.JWT_HEADER_NAME!)!.split(' ')[1];
	const jwtPayload = await jwtverify(token, env.JWT_SECRET!);
	const userID = jwtPayload.sub_id;
	const users = await getAllUsers(userID);
	return c.json(users);
});

userController.get('/info', async (c) => {
	const token = c.req.header(env.JWT_HEADER_NAME!)!.split(' ')[1];
	const jwtPayload = await jwtverify(token, env.JWT_SECRET!);

	return c.json({
		id: jwtPayload.sub_id,
		email: jwtPayload.sub,
		firstname: jwtPayload.given_name,
		lastname: jwtPayload.family_name,
		phone: jwtPayload.phone,
	});
});

userController.put('/info', async (c) => {
	const body = await c.req.json();
	const token = c.req.header(env.JWT_HEADER_NAME!)!.split(' ')[1];
	const jwtPayload = await jwtverify(token, env.JWT_SECRET!);
	const userID = jwtPayload.sub_id;
	const { firstname, lastname, email, phone, iban, tckn, accountname, bankcode, branchcode, password } = body;
	const user = await editUserInfoService(firstname, lastname, email, phone, iban, tckn, accountname, bankcode, branchcode, userID, password);
	return c.json(user);
});

userController.get('/:id',async (c: Context, next: Next) => {
		const accessToken = c.req.header(env.JWT_HEADER_NAME!)!.split(' ')[1];
		const { sub_id } = jwtdecode(accessToken).payload;
		if (parseInt(sub_id) !== parseInt(c.req.param('id'))) {
			return await checkPermission(['user:view'])(c, next);
		} else {
			await next();
		}
	},
	async (c) => {
		const id = c.req.param('id');
		const user = await getUserById(id);
		return c.json(user);
	}
);

userController.post('/', checkPermission(['user:create']), async (c) => {
	const token = c.req.header(env.JWT_HEADER_NAME!)!.split(' ')[1];
	const jwtPayload = await jwtverify(token, env.JWT_SECRET!);
	const createdby = jwtPayload.sub_id;
	const { firstname, lastname, email, password, phone, userroles, userpermissions, tckn, bankcode, branchcode, accountname, iban, unitmanagers } = await c.req.json();
	const user = await createService(firstname, lastname, email, password, phone, userroles, userpermissions, tckn, bankcode, branchcode, accountname, iban, unitmanagers, createdby);
	return c.json(user);
});

userController.put('/:id', checkPermission(['user:update']), async (c) => {
	const id = c.req.param('id');
	const { firstname, lastname, email, password, phone, userroles, userpermissions, tckn, bankcode, branchcode, accountname, iban, unitmanagers } = await c.req.json();
	const token = c.req.header(env.JWT_HEADER_NAME!)!.split(' ')[1];
	const jwtPayload = await jwtverify(token, env.JWT_SECRET!);
	const updatedby = jwtPayload.sub_id;
	const user = await editService(parseInt(id), firstname, lastname, email, password, phone, userroles, userpermissions, tckn, bankcode, branchcode, accountname, iban, unitmanagers, updatedby);
	return c.json(user);
});

userController.put('/:id/archive', checkPermission(['user:changestatus']), async (c) => {
	const id = c.req.param('id');
	const token = c.req.header(env.JWT_HEADER_NAME!)!.split(' ')[1];
	const jwtPayload = await jwtverify(token, env.JWT_SECRET!);
	const updatedby = jwtPayload.sub_id;
	const user = await archiveService(parseInt(id), updatedby);
	return c.json(user);
});

userController.put('/:id/activate', checkPermission(['user:changestatus']), async (c) => {
	const id = c.req.param('id');
	const token = c.req.header(env.JWT_HEADER_NAME!)!.split(' ')[1];
	const jwtPayload = await jwtverify(token, env.JWT_SECRET!);
	const updatedby = jwtPayload.sub_id;
	const user = await activateService(parseInt(id), updatedby);
	return c.json(user);
});

userController.get('/profile', checkPermission(['profile:view']), async (c) => {
	const token = c.req.header(env.JWT_HEADER_NAME!)!.split(' ')[1];
	const jwtPayload = await jwtverify(token, env.JWT_SECRET!);
	const id = jwtPayload.sub_id;
	const profile = await profileService(id);
	return c.json(profile);
});

export default userController;
