import pc from 'helpers/prismaclient.singleton';
import { HTTPException } from 'hono/http-exception';
import HttpStatusCode from 'types/enums/httpstatuses';

// User Create when createdby permission is admin
export const createService = async (firstname: string, lastname: string, email: string, password: string, phone: string | null, userroles: Array<number>, userpermissions: Array<number>, tckn: string | null, bankcode: string | null, branchcode: string | null, accountname: string | null, iban: string, unitmanagers: Array<number>, createdby: number) => {
	const isEmailExists = await pc.user.findFirst({
		select: {
			email: true,
		},
		where: {
			email: email,
		},
	});

	if (isEmailExists) throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'email_already_exists' });

	const user = await pc.user.create({
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
			iban: true,
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
		},
		data: {
			firstname: firstname,
			lastname: lastname,
			email: email,
			password: password,
			createdat: new Date(),
			phone: phone,
			createdby: createdby,
			unitmanagers: {
				createMany: {
					data: unitmanagers.map((unitmanager) => {
						return {
							unitmanagerid: unitmanager,
							createdby: createdby,
							createdat: new Date(),
						};
					}),
				},
			},
			userroles: {
				createMany: {
					data: userroles.map((role) => {
						return {
							roleid: role,
							createdby: createdby,
							createdat: new Date(),
						};
					}),
				},
			},
			userpermissions: {
				createMany: {
					data: userpermissions.map((permission) => {
						return {
							permissionid: permission,
							createdby: createdby,
							createdat: new Date(),
						};
					}),
				},
			},
			tckn: tckn || null,
			bankcode: bankcode || null,
			branchcode: branchcode || null,
			accountname: accountname || null,
			iban: iban,
		},
	});

	if (!user) throw new HTTPException(400, { message: 'user_could_not_be_created' });

	return { data: user, message: 'user_created_successfully' };
};
