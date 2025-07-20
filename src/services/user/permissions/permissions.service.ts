import pc from 'helpers/prismaclient.singleton';
import HttpStatusCode from 'types/enums/httpstatuses';
import { HTTPException } from 'hono/http-exception';

export const getService = async () => {
	const permissions = await pc.permission.findMany({
		select: {
			id: true,
			name: true,
			value: true,
			description: true,
			group: true,
		},
		orderBy: {
			group: 'asc',
		},
	});

	if (!permissions) throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'no_selected_permissions_found' });

	return permissions;
};
