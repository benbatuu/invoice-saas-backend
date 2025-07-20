import pc from 'helpers/prismaclient.singleton';
import HttpStatusCode from 'types/enums/httpstatuses';
import { HTTPException } from 'hono/http-exception';
import PaymentStatus from 'types/enums/paymentstatus';

export const getUserById = async (id: string) => {

	const user = await pc.user.findFirst({
		include: {
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
		where: { id: id },
	});

	if (!user) throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'no_selected_user_found' });


	return {
		...user
	};
};
