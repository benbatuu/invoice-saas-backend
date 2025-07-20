import pc from 'helpers/prismaclient.singleton';
import { HTTPException } from 'hono/http-exception';
import HttpStatusCode from 'types/enums/httpstatuses';

export const createRoleService = async (name: string, rolepermissions: Array<number>, userID: number) => {
	const role = await pc.role.create({
		select: {
			id: true,
			name: true,
			createdby: true,
			createdat: true,
		},
		data: {
			name: name,
			createdby: userID,
			createdat: new Date(),
			rolepermissions: {
				createMany: {
					data: rolepermissions.map((rolepermission) => {
						return {
							permissionid: rolepermission,
							createdby: userID,
							createdat: new Date(),
						};
					}),
				},
			},
		},
	});

	if (!role) throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'role_or_role_permissions_couln_not_be_created' });

	return role;
};
