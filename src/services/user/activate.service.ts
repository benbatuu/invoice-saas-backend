import pc from 'helpers/prismaclient.singleton';
import { HTTPException } from 'hono/http-exception';
import HttpStatusCode from 'types/enums/httpstatuses';
import UserStatus from 'types/enums/userstatus';

export const activateService = async (userid: number, updatedby: number) => {
	const user = await pc.user.findUnique({ where: { id: userid } });
	if (!user) throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'no_selected_user_found' });

	if (user.status === UserStatus.ACTIVE) throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'user_already_active' });

	await pc.user.update({
		where: { id: userid },
		data: {
			status: UserStatus.ACTIVE,
			updatedat: new Date(),
			updatedby: updatedby,
		},
	});

	return { data: user, message: 'user_status_changed_passive_to_active_successfully' };
};
