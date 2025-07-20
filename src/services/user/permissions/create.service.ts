import pc from 'helpers/prismaclient.singleton';
import { HTTPException } from 'hono/http-exception';
import HttpStatusCode from 'types/enums/httpstatuses';

export const createPermissionService = async (name: string, value: string, group: string, description: string, userID: number) => {
	const permission = await pc.permission.create({
		select: {
			id: true,
			name: true,
			value: true,
			group: true,
			description: true,
			createdat: true,
			createdby: true,
		},
		data: {
			name: name,
			value: value,
			group: group,
			description: description,
			createdat: new Date(),
			createdby: userID,
		},
	});

	if (!permission) throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'permission_couln_not_be_created' });

	return permission;
};
