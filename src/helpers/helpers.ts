import { Context } from 'hono';
import { v4 as uuidv4 } from 'uuid';

const generateRefreshToken = (userid: string) => `${uuidv4()}${userid}${uuidv4()}`.replace(/[-]/g, '');

const generateTraceCode = () => {
	const givenSet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

	let code = '';
	for (let i = 0; i < 8; i++) {
		let pos = Math.floor(Math.random() * givenSet.length);
		code += givenSet[pos];
	}
	return code;
};

const findIPAddress = (c: Context) => c.req.header('CF-Connecting-IP') || c.req.header('X-Real-IP') || c.req.header('X-Forwarded-For') || '';

const todayDateTime = () => {
	const now = new Date();
	const formattedDate = now.toLocaleString('tr-TR', {
		timeZone: 'Europe/Istanbul',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		minute: '2-digit',
		hour: '2-digit',
	});
	const replaced = formattedDate.replace('.', '').replace('.', '').replace(' ', '').replace(':', '').replace(':', '');
	return replaced;
};

const isValidMsisdn = (msisdn: string) => {
	const regexp = /(501|505|506|507|551|552|553|554|555|559|530|531|532|533|534|535|536|537|538|539|561|540|541|542|543|544|545|546|547|548|549)( )?([0-9]{3})( )?([0-9]{2})( )?([0-9]{2})/;

	if (msisdn.startsWith('5') && msisdn.length === 10 && regexp.test(msisdn)) return true;
	return false;
};

export { generateRefreshToken, generateTraceCode, findIPAddress, todayDateTime, isValidMsisdn };
