import pc from 'helpers/prismaclient.singleton';
import HttpStatusCode from 'types/enums/httpstatuses';
import { HTTPException } from 'hono/http-exception';

export const getService = async () => {
	const roles = await pc.role.findMany({
		select: {
			id: true,
			name: true,
			issystemrole: true,
			rolepermissions: {
				select: {
					permission: {
						select: {
							id: true,
							name: true,
							description: true,
						},
					},
				},
			},
		},
		orderBy: {
			name: 'asc',
		},
	});

	if (!roles) throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'no_selected_role_found' });

	return roles;
};
