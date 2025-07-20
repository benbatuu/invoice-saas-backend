import pc from 'helpers/prismaclient.singleton';

export const profileService = async (id: string) => {
	const userProfile = await pc.user.findFirst({
		where: { id: id },
		include:{
			payments:true,
			subscriptions:true,
			plan:true,
			notificationuser:true,
			transactions:true,
			invoices:true,
		}
	});

	return { data: userProfile, message: 'user_profile_successfully_listed' };
};
