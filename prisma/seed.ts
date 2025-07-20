import pc from '../src/helpers/prismaclient.singleton';
import * as bcrypt from 'bcryptjs';

async function main() {
  const roles = [
    {
      id: 'a1f1c5ab-6b3c-45ef-a7a2-728b8ddc1f0b',
      name: 'admin',
      issystemrole: true,
    },
    {
      id: '13de3d17-9c97-42aa-b0ef-c96c1740c176',
      name: 'user',
      issystemrole: true,
    },
    {
      id: '80b3a913-3be1-4d2f-9e35-bba048073dd6',
      name: 'free',
      issystemrole: true,
    },
  ];

  const permissions = [
    {
      "id": "2de34842-b3c4-489e-9b2b-7882230e6b8a",
      "name": "Kullanıcıları Görüntüle",
      "value": "user:read",
      "group": "users",
      "description": "Tüm kullanıcıları görüntüleyebilir"
    },
    {
      "id": "ac1f37dc-85df-47f5-94ff-399f1cb5f6b9",
      "name": "Kullanıcı Oluştur",
      "value": "user:create",
      "group": "users",
      "description": "Yeni kullanıcı oluşturabilir"
    },
    {
      "id": "e91a8f20-7f2e-4e44-a0e3-d9357f2a2a56",
      "name": "Kullanıcı Güncelle",
      "value": "user:update",
      "group": "users",
      "description": "Kullanıcı bilgilerini güncelleyebilir"
    },
    {
      "id": "d10c96c1-09f1-43d5-848a-8cb1dd35d9cf",
      "name": "Kullanıcı Sil",
      "value": "user:delete",
      "group": "users",
      "description": "Kullanıcıyı silebilir"
    },
    {
      "id": "98c2de15-40de-4ea0-afe3-befbe3c9c217",
      "name": "Kendi Profilini Güncelle",
      "value": "profile:update",
      "group": "profile",
      "description": "Kullanıcı kendi bilgilerini güncelleyebilir"
    },
    {
      "id": "fe5f3cc8-9bd8-47d3-9008-2e8c1234f99d",
      "name": "Kendi Profilini Görüntüle",
      "value": "profile:view",
      "group": "profile",
      "description": "Kullanıcı kendi bilgilerini görüntüleyebilir"
    },
    {
      "id": "43f2b48c-17de-4570-9b4d-111b9e1d789d",
      "name": "Rolleri Düzenle",
      "value": "roles:update",
      "group": "roles",
      "description": "Rolleri düzenleyebilir"
    },
    {
      "id": "a66382df-0d97-46d5-89cf-fbf92c5d9e7d",
      "name": "Rolleri Görüntüle",
      "value": "roles:read",
      "group": "roles",
      "description": "Tüm rolleri görüntüleyebilir"
    },
    {
      "id": "32f3c84a-d4cf-4bbf-bbce-1a294f8c1c6a",
      "name": "Rol Oluştur",
      "value": "roles:create",
      "group": "roles",
      "description": "Yeni rol oluşturabilir"
    },
    {
      "id": "9a7a8944-84c3-4f20-8a3b-3c42b93329b4",
      "name": "Rol Sil",
      "value": "roles:delete",
      "group": "roles",
      "description": "Rol silebilir"
    },
    {
      "id": "d94dffbc-d560-4f64-bb1a-3ae2361b8f12",
      "name": "Fatura Oluştur",
      "value": "invoice:create",
      "group": "invoice",
      "description": "Fatura oluşturabilir"
    },
    {
      "id": "885324e0-d882-452c-aad0-9bb7c940a998",
      "name": "Faturaları Görüntüle",
      "value": "invoice:read",
      "group": "invoice",
      "description": "Fatura listesini görüntüleyebilir"
    },
    {
      "id": "e77ed7d3-1995-48a8-8157-72a2169f2a7f",
      "name": "Fatura Güncelle",
      "value": "invoice:update",
      "group": "invoice",
      "description": "Faturaları düzenleyebilir"
    },
    {
      "id": "68a20e95-029d-4ef6-8f90-95f65cebc402",
      "name": "Fatura Sil",
      "value": "invoice:delete",
      "group": "invoice",
      "description": "Faturaları silebilir"
    },
    {
      "id": "ae8f9383-d383-4dbe-aea6-18c300a0d091",
      "name": "Ödeme Görüntüle",
      "value": "payment:read",
      "group": "payment",
      "description": "Ödeme bilgilerini görüntüleyebilir"
    },
    {
      "id": "86f3e8a3-e37f-401f-bd40-c4b3c94b18cc",
      "name": "Abonelik Başlat",
      "value": "subscription:start",
      "group": "subscription",
      "description": "Kullanıcının aboneliğini başlatabilir"
    },
    {
      "id": "4b81cc93-0504-4f9e-8f0d-bb0077cbfdb6",
      "name": "Aboneliği Görüntüle",
      "value": "subscription:read",
      "group": "subscription",
      "description": "Abonelik durumlarını görüntüleyebilir"
    },
    {
      "id": "5cb119a0-bce5-4f2f-a191-3e77a87cf7d0",
      "name": "Bildirimleri Görüntüle",
      "value": "notification:read",
      "group": "notifications",
      "description": "Kullanıcılara gönderilen bildirimleri görebilir"
    },
    {
      "id": "f17a2ae7-51e5-4b0f-a469-dc9849829c24",
      "name": "API Client Yönet",
      "value": "client:manage",
      "group": "client",
      "description": "API client oluşturabilir ve düzenleyebilir"
    },
    {
      "id": "f5d979fc-32c8-47ec-abc7-3c7b1a8f7226",
      "name": "Log Kayıtlarını Görüntüle",
      "value": "log:read",
      "group": "logs",
      "description": "Sistem aktivitelerini ve loglarını görüntüleyebilir"
    },
    {
      "id": "e91bdc3a-cd45-440b-9eb3-24fd4aaf6713",
      "name": "Parametreleri Güncelle",
      "value": "settings:update",
      "group": "settings",
      "description": "Kullanıcı parametre ayarlarını düzenleyebilir"
    }
  ];

  const plans = [
    {
      id: 'be22d4a6-92f2-4a7f-9e10-1a1e0f0faaa1',
      name: 'Free',
      price: '0',
      currency: 'usd',
      interval: 'monthly',
      description: 'For individuals getting started',
      stripePriceId: null,
      stripeProductId: null,
    },
    {
      id: '2bca6e82-73c4-4fa1-9b92-c3c8cbebbb02',
      name: 'Starter',
      price: '19',
      currency: 'usd',
      interval: 'monthly',
      description: 'For freelancers & small teams',
      stripePriceId: 'price_1RlW8g4J0g4hM3ZykqsuUqul',
      stripeProductId: 'prod_SgtwGHw3s7mxhU',
    },
    {
      id: '96b83a43-cc34-4262-98c3-34a7eb87cc03',
      name: 'Starter',
      price: '180',
      currency: 'usd',
      interval: 'yearly',
      description: 'For freelancers & small teams',
      stripePriceId: 'price_1RlW8C4J0g4hM3Zy0eYB6ukT',
      stripeProductId: 'prod_SgtwGHw3s7mxhU',
    },
    {
      id: '382d6c5f-4a66-4d5b-b1d7-d14df54fc804',
      name: 'Pro',
      price: '39',
      currency: 'usd',
      interval: 'monthly',
      description: '',
      stripePriceId: 'price_1RlW9L4J0g4hM3Zymmh82d6O',
      stripeProductId: 'prod_SgtxZ2SPdaQrO6',
    },
    {
      id: 'ed027ea3-7e82-4d6b-ae21-d4c5c5cfe205',
      name: 'Pro',
      price: '380',
      currency: 'usd',
      interval: 'yearly',
      description: '',
      stripePriceId: 'price_1RlW9o4J0g4hM3ZyjidVDEM5',
      stripeProductId: 'prod_SgtxZ2SPdaQrO6',
    },
    {
      id: 'f11e5820-63ad-4ef9-9485-033e2d3a6a06',
      name: 'Business',
      price: '79',
      currency: 'usd',
      interval: 'monthly',
      description: '',
      stripePriceId: 'price_1RlWAb4J0g4hM3ZyaMQflFAN',
      stripeProductId: 'prod_SgtyadkiV9Ffla',
    },
    {
      id: '9a8f1de4-f1e1-47a7-934e-93e32f789e07',
      name: 'Business',
      price: '780',
      currency: 'usd',
      interval: 'yearly',
      description: '',
      stripePriceId: 'price_1RlWB04J0g4hM3Zy1oG0Zg4Y',
      stripeProductId: 'prod_SgtyadkiV9Ffla',
    },
  ];


  await pc.user.create({
	data:{
		id:"b7238edc-7154-4d7a-9ca4-de5a5a6b6aa5",
		firstname:"Batuhan",
		lastname:"Küçük",
		email:"bennbatuu@gmail.com",
		password:await bcrypt.hash("1905Batuhan.",12),
		companyLogoUrl:"https://avatars.githubusercontent.com/u/42724094?v=4",
		companyName:"bennbatuu",
		taxId:"1234567890",
		address:"Yeşilce mahallesi define sokak Kağıthane / İstanbul",
		phone:"+905414725820",
		createdat:new Date(),
		createdby:"b7238edc-7154-4d7a-9ca4-de5a5a6b6aa5",
		updatedat:new Date(),
		updatedby:"b7238edc-7154-4d7a-9ca4-de5a5a6b6aa5"
	}
  })
  
  await pc.apiclient.create({
    data: {
      name: 'Api Client',
      key: 'CD85gE3DU94a8Uif42fitid9Pugsnrad',
      secret: '3v8OPhKz7jfFmxd4KYmT6v0lnWm14Agm',
      type: 1,
      isactive: true,
      createdby: 'b7238edc-7154-4d7a-9ca4-de5a5a6b6aa5',
    },
  });

  await pc.role.createMany({
	data: roles.map(role => ({
		id:role.id,
		name:role.name,
		issystemrole:role.issystemrole,
		createdat:new Date(),
		createdby: 'b7238edc-7154-4d7a-9ca4-de5a5a6b6aa5',
	}))
})

  await pc.permission.createMany({
	data:permissions.map(permission => ({
		id:permission.id,
		name:permission.name,
		description:permission.description,
		group:permission.group,
		value:permission.value,
		createdat:new Date(),
		createdby: 'b7238edc-7154-4d7a-9ca4-de5a5a6b6aa5',
	}))
})

  await pc.plan.createMany({
	data: plans.map(plan => ({
	  id: plan.id,
	  name: plan.name,
	  price: plan.price,
	  currency: plan.currency,
	  interval: plan.interval,
	  description: plan.description,
	  stripePriceId: plan.stripePriceId,
	  stripeProductId: plan.stripeProductId,
	  createdat: new Date()
	}))
  });
  

  console.log('Seed tamamlandı.');
}

main()
  .then(async () => {
    await pc.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await pc.$disconnect();
    process.exit(1);
  });
