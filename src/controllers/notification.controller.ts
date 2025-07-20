import { env } from 'bun';
import { Hono } from 'hono';
import checkPermission from 'helpers/permission.middleware';
import { verify as jwtverify } from 'hono/jwt';
import { getNotifications } from 'services/notification/get.service';
import { readAllNotifications, readNotification } from 'services/notification/read.service';

const notificationController = new Hono();

notificationController.get('/', checkPermission(['notification:view']), async (c) => {
	const token = c.req.header(env.JWT_HEADER_NAME!)!.split(' ')[1];
	const jwtPayload = await jwtverify(token, env.JWT_SECRET!);
	const userID = jwtPayload.sub_id;
	const notifications = await getNotifications(userID);
	return c.json(notifications);
});

notificationController.put('/:id/read', checkPermission(['notification:view']), async (c) => {
	const notiId = parseInt(c.req.param('id'));
	const token = c.req.header(env.JWT_HEADER_NAME!)!.split(' ')[1];
	const jwtPayload = await jwtverify(token, env.JWT_SECRET!);
	const userID = jwtPayload.sub_id;
	const notifications = await readNotification(notiId, userID);

	return c.json(notifications);
});

notificationController.put('/read', checkPermission(['notification:view']), async (c) => {
	const token = c.req.header(env.JWT_HEADER_NAME!)!.split(' ')[1];
	const jwtPayload = await jwtverify(token, env.JWT_SECRET!);
	const userID = jwtPayload.sub_id;
	const notifications = await readAllNotifications(userID);

	return c.json(notifications);
});

export default notificationController;
