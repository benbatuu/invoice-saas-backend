import pc from 'helpers/prismaclient.singleton';
import { HTTPException } from 'hono/http-exception';
import HttpStatusCode from 'types/enums/httpstatuses';

export const editRoleService = async (id: number, name: string, userID: number, rolepermissions: Array<number>) => {
	const deleteExistingRoles = await pc.rolepermission.deleteMany({
		where: {
			roleid: id,
		},
	});
	if (!deleteExistingRoles) throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'role_permissions_couln_not_be_deleted' });

	const role = await pc.role.update({
		where: {
			id: id,
		},
		select: {
			id: true,
			name: true,
			createdby: true,
			createdat: true,
			updatedat: true,
			updatedby: true,
			rolepermissions: {
				select: {
					roleid: true,
					permissionid: true,
					permission: {
						select: {
							name: true,
							value: true,
							group: true,
							description: true,
						},
					},
				},
			},
		},
		data: {
			name: name,
			updatedat: new Date(),
			updatedby: userID,
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

	if (!role) throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'role_couln_not_be_updated' });

	return role;
};
