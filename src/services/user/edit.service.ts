import pc from 'helpers/prismaclient.singleton';
import { HTTPException } from 'hono/http-exception';
import HttpStatusCode from 'types/enums/httpstatuses';

// User Create when createdby permission is admin
export const editService = async (userid: number, firstname: string, lastname: string, email: string, password: string, phone: string | null, userroles: Array<number>, userpermissions: Array<number>, tckn: string | null, bankcode: string | null, branchcode: string | null, accountname: string | null, iban: string, unitmanagers: Array<number>, updatedby: number) => {
	const user = await pc.user.findUnique({ where: { id: userid } });
	if (!user) throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'no_selected_user_found' });

	if (user.email !== email) {
		const emailExists = await pc.user.findFirst({ where: { email: email } });
		if (emailExists) throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'email_already_exists' });
	}

	await pc.user.update({
		select: {
			id: true,
			firstname: true,
			lastname: true,
			email: true,
			phone: true,
			createdat: true,
			createdby: true,
			tckn: true,
			bankcode: true,
			branchcode: true,
			accountname: true,
			iban: true,
			unitmanagers: {
				select: {
					unitmanagerid: true,
					unitmanager: {
						select: {
							id: true,
							firstname: true,
							lastname: true,
							email: true,
							phone: true,
						},
					},
				},
			},
			userroles: {
				select: {
					role: {
						select: {
							name: true,
							rolepermissions: {
								select: {
									permission: {
										select: {
											name: true,
										},
									},
								},
							},
						},
					},
				},
			},
			userpermissions: {
				select: {
					permission: {
						select: {
							name: true,
						},
					},
				},
			},
		},
		where: {
			id: userid,
		},
		data: {
			firstname: firstname,
			lastname: lastname,
			email: email,
			password: password,
			updatedat: new Date(),
			updatedby: updatedby,
			phone: phone,
			tckn: tckn || null,
			bankcode: bankcode,
			branchcode: branchcode,
			accountname: accountname,
			iban: iban,
			unitmanagers: {
				deleteMany: {},
				createMany: {
					data: unitmanagers.map((unitmanager) => {
						return {
							createdby: updatedby,
							createdat: new Date(),
							unitmanagerid: unitmanager,
						};
					}),
				},
			},
			userroles: {
				deleteMany: {},
				createMany: {
					data: userroles.map((role) => {
						return {
							roleid: role,
							createdby: updatedby,
							createdat: new Date(),
						};
					}),
				},
			},
			userpermissions: {
				deleteMany: {},
				createMany: {
					data: userpermissions.map((permission) => {
						return {
							permissionid: permission,
							createdby: updatedby,
							createdat: new Date(),
						};
					}),
				},
			},
		},
	});

	return { data: user, message: 'user_updated_successfully' };
};
