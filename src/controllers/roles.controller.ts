import checkPermission from 'helpers/permission.middleware';
import { getService } from '../services/user/roles/get.service';
import { Hono } from 'hono';
import { createRoleService } from 'services/user/roles/create.service';
import { env } from 'bun';
import { verify as jwtverify } from 'hono/jwt';
import { editRoleService } from 'services/user/roles/edit.service';
import { deleteRoleService } from 'services/user/roles/delete.service';

const rolesController = new Hono();

rolesController.get('/', checkPermission(['role:view']), async (c) => {
	const roles = await getService();
	return c.json(roles);
});

rolesController.post('/', checkPermission(['role:create']), async (c) => {
	const { name, rolepermissions } = await c.req.json();
	const token = c.req.header(env.JWT_HEADER_NAME!)!.split(' ')[1];
	const jwtPayload = await jwtverify(token, env.JWT_SECRET!);
	const userID = jwtPayload.sub_id;
	const createdRole = await createRoleService(name, rolepermissions, userID);
	return c.json(createdRole);
});

rolesController.put('/:id', checkPermission(['role:update']), async (c) => {
	const id = c.req.param('id');
	const { name, rolepermissions } = await c.req.json();
	const token = c.req.header(env.JWT_HEADER_NAME!)!.split(' ')[1];
	const jwtPayload = await jwtverify(token, env.JWT_SECRET!);
	const userID = jwtPayload.sub_id;
	const updatedRole = await editRoleService(parseInt(id), name, userID, rolepermissions);
	return c.json(updatedRole);
});

rolesController.delete('/:id', checkPermission(['role:delete']), async (c) => {
	const id = c.req.param('id');
	const token = c.req.header(env.JWT_HEADER_NAME!)!.split(' ')[1];
	const jwtPayload = await jwtverify(token, env.JWT_SECRET!);
	const userID = jwtPayload.sub_id;
	const deletedRole = await deleteRoleService(parseInt(id));
	return c.json(deletedRole);
});

export default rolesController;
