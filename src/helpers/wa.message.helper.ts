import axios from 'axios';
import WATemplate from 'types/enums/wa.templates';

axios.defaults.baseURL = process.env.WA_CLOUD_API_BASE_URL;
axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.headers['Accept'] = 'application/json';
axios.defaults.headers['Authorization'] = `Bearer ${process.env.WA_CLOUD_API_TOKEN}`;

type WABody = {
	messaging_product: string;
	to: string;
	type: string;
	template: WABodyTemplate;
};

type WABodyTemplate = {
	name: string;
	language: WABodyTemplateLanguage;
	components: WABodyTemplateComponent[];
};

type WABodyTemplateComponent = {
	type: string;
	parameters: WABodyTemplateParameter[];
	sub_type?: string;
	index?: number;
};

type WABodyTemplateParameter = {
	type: string;
	text: string;
};

type WABodyTemplateLanguage = {
	code: string;
};

type WAParams = {
	payment_id: number;
	payment_amount: number | undefined;
	payment_name: string | undefined;
	payment_description: string | undefined;
	spending_name: string | undefined;
	deny_reason: string | undefined;
	extrapay_amount: number | undefined;
	payment_new_amount: number | undefined;
	refund_amount: number | undefined;
	spending_amount: number | undefined;
	user_name: string | undefined;
	unitmanager_name: string | undefined;
};

export default class WAMessage {
	private readonly _template: WATemplate;
	private readonly _to: string[];
	private readonly _params: WAParams;
	private readonly _responses: any[] = [];

	public constructor(args: { to: string[]; template: WATemplate; payment_id: number; payment_amount?: number; payment_name?: string; payment_description?: string; spending_name?: string; deny_reason?: string; extrapay_amount?: number; payment_new_amount?: number; refund_amount?: number; spending_amount?: number; user_name?: string; unitmanager_name?: string }) {
		this._to = args.to;
		this._template = args.template;
		this._params = { payment_id: args.payment_id, payment_amount: args.payment_amount, payment_name: args.payment_name, payment_description: args.payment_description, spending_name: args.spending_name, deny_reason: args.deny_reason, extrapay_amount: args.extrapay_amount, payment_new_amount: args.payment_new_amount, refund_amount: args.refund_amount, spending_amount: args.spending_amount, user_name: args.user_name, unitmanager_name: args.unitmanager_name };
	}

	async send() {
		let data: WABody = {
			messaging_product: 'whatsapp',
			type: 'template',
			to: '',
			template: {
				name: this._template,
				language: { code: 'tr' },
				components: [
					{ type: 'body', parameters: [] },
					{ type: 'button', sub_type: 'url', index: 0, parameters: [{ type: 'text', text: this._params.payment_id.toString() }] },
				],
			},
		};
		switch (this._template) {
			case WATemplate.spending_rejected:
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_amount!.toLocaleString('tr-TR') });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_name! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_description! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.spending_name! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.deny_reason! });
				break;
			case WATemplate.payment_approved:
			case WATemplate.payment_rollback:
			case WATemplate.payment_finance_approved:
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_name! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_description! });
				break;
			case WATemplate.extrapay_approved:
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_name! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_description! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.extrapay_amount!.toLocaleString('tr-TR') });
				break;
			case WATemplate.payment_rejected:
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_name! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_description! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_amount!.toLocaleString('tr-TR') });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.deny_reason! });
				break;
			case WATemplate.payment_approved_different_amount:
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_name! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_description! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_amount!.toLocaleString('tr-TR') });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_new_amount!.toLocaleString('tr-TR') });
				break;
			case WATemplate.refund_approved:
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_name! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_description! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.refund_amount!.toLocaleString('tr-TR') });
				break;
			case WATemplate.spending_approved:
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_name! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_description! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.spending_amount!.toLocaleString('tr-TR') });
				break;
			case WATemplate.payment_approve_request:
				data.template.components[0].parameters.push({ type: 'text', text: this._params.user_name! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_name! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_description! });
				break;
			case WATemplate.extrapay_request:
				data.template.components[0].parameters.push({ type: 'text', text: this._params.user_name! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_name! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_description! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.extrapay_amount!.toLocaleString('tr-TR') });
				break;
			case WATemplate.payment_request:
				data.template.components[0].parameters.push({ type: 'text', text: this._params.user_name! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_name! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_description! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_amount!.toLocaleString('tr-TR') });
				break;
			case WATemplate.payment_pending_finance_approval:
				data.template.components[0].parameters.push({ type: 'text', text: this._params.user_name! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_name! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_description! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_amount!.toLocaleString('tr-TR') });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.unitmanager_name! });
				break;
			case WATemplate.refund_request:
				data.template.components[0].parameters.push({ type: 'text', text: this._params.user_name! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_name! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_description! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.refund_amount!.toLocaleString('tr-TR') });
				break;
			case WATemplate.spending_created:
				data.template.components[0].parameters.push({ type: 'text', text: this._params.user_name! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_name! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.payment_description! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.spending_name! });
				data.template.components[0].parameters.push({ type: 'text', text: this._params.spending_amount!.toLocaleString('tr-TR') });
				break;
			default:
				break;
		}
		try {
			for (const to of this._to) {
				data.to = `90${to}`;
				const response = await axios.post(`${process.env.WA_PHONE_NUMBER_ID}/messages`, data);
				this._responses.push(response.data);
			}

			return this._responses;
		} catch (err) {
			console.log(err);
			return this._responses;
		}
	}
}
