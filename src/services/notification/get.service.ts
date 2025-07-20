import pc from 'helpers/prismaclient.singleton';
import { HTTPException } from 'hono/http-exception';
import HttpStatusCode from 'types/enums/httpstatuses';

export const getNotifications = async (userID: number) => {
	const notifications = await pc.notification.findMany({
		select: {
			touserid: true,
			message: true,
			url: true,
			readedat: true,
			createdby: true,
			createdat: true,
			to: {
				select: {
					firstname: true,
					lastname: true,
				},
			},
		},
		where: {
			touserid: userID,
		},
		orderBy: {
			createdat: 'desc',
		},
	});

	if (!notifications) {
		throw new HTTPException(HttpStatusCode.NOT_FOUND, { message: 'no_notification_found' });
	}
	return notifications;
};
