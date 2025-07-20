import pc from 'helpers/prismaclient.singleton';
import { HTTPException } from 'hono/http-exception';
import HttpStatusCode from 'types/enums/httpstatuses';

export const editUserInfoService = async (firstname: string, lastname: string, email: string, phone: string, iban: string, tckn: string | null, accountname: string | null, bankcode: string | null, branchcode: string | null, userid: number, password?: string) => {
	if (password) {
		const userUpdateWithPassword = await pc.user.update({
			select: {
				id: true,
				firstname: true,
				lastname: true,
				email: true,
				password: true,
				phone: true,
				iban: true,
				tckn: true,
				accountname: true,
				bankcode: true,
				branchcode: true,
			},
			where: {
				id: userid,
			},
			data: {
				firstname: firstname,
				lastname: lastname,
				email: email,
				phone: phone,
				password: password,
				updatedby: userid,
				iban: iban,
				tckn: tckn,
				accountname: accountname,
				bankcode: bankcode,
				branchcode: branchcode,
			},
		});

		if (!userUpdateWithPassword)
			throw new HTTPException(HttpStatusCode.BAD_REQUEST, {
				message: 'user_couldnt_updated',
			});

		return userUpdateWithPassword;
	}

	const userUpdateWithoutPassword = await pc.user.update({
		select: {
			id: true,
			firstname: true,
			lastname: true,
			email: true,
			password: true,
			phone: true,
			iban: true,
			tckn: true,
			accountname: true,
			bankcode: true,
			branchcode: true,
		},
		where: {
			id: userid,
		},
		data: {
			firstname: firstname,
			lastname: lastname,
			email: email,
			phone: phone,
			updatedby: userid,
			iban: iban,
			tckn: tckn,
			accountname: accountname,
			bankcode: bankcode,
			branchcode: branchcode,
		},
	});

	if (!userUpdateWithoutPassword)
		throw new HTTPException(HttpStatusCode.BAD_REQUEST, {
			message: 'user_couldnt_updated',
		});

	return userUpdateWithoutPassword;
};
