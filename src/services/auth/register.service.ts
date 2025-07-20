import pc from 'helpers/prismaclient.singleton';
import { HTTPException } from 'hono/http-exception';
import { sign as jwtsign } from 'hono/jwt';
import { env } from 'bun';
import HttpStatusCode from 'types/enums/httpstatuses';
import * as bcrypt from 'bcryptjs';
import TransactionType from 'types/enums/transactiontype';

export const registerUser = async (
    firstname: string,
    lastname: string,
    email: string,
    planId: string,
    password: string,
    companyName: string,
    companyLogoUrl: string,
    taxId: string,
    address: string,
    phone: string,
    stripeId: string,
    paymentStatus: string,
    externalInvoiceId: string, // Stripe'dan gelen invoiceId, sadece referans için
    userroles: string[] = [], // <-- eklendi
    userpermissions: string[] = [] // <-- eklendi
) => {

    const planInfo = await pc.plan.findUnique({ where: { id: planId } });
    if (!planInfo)
        throw new HTTPException(HttpStatusCode.BAD_REQUEST, { message: 'plan_not_found' });

    // Planlara göre rol ve izin atama
    let autoUserRoles: string[] = [];
    let autoUserPermissions: string[] = [];
    const planName = (planInfo.name || '').toLowerCase().trim();
    console.log('planInfo.name (raw):', planInfo.name);
    console.log('planName (normalized):', planName);
    if (planName === 'free') {
        autoUserRoles = ['80b3a913-3be1-4d2f-9e35-bba048073dd6']; // free rolü
        autoUserPermissions = [
            'fe5f3cc8-9bd8-47d3-9008-2e8c1234f99d', // profile:view
            '885324e0-d882-452c-aad0-9bb7c940a998', // invoice:read
            '5cb119a0-bce5-4f2f-a191-3e77a87cf7d0', // notification:read
        ];
    } else if (planName === 'starter') {
        autoUserRoles = ['13de3d17-9c97-42aa-b0ef-c96c1740c176']; // user rolü
        autoUserPermissions = [
            'fe5f3cc8-9bd8-47d3-9008-2e8c1234f99d', // profile:view
            '885324e0-d882-452c-aad0-9bb7c940a998', // invoice:read
            'd94dffbc-d560-4f64-bb1a-3ae2361b8f12', // invoice:create
            '86f3e8a3-e37f-401f-bd40-c4b3c94b18cc', // subscription:start
        ];
    } else if (planName === 'pro' || planName === 'business') {
        autoUserRoles = ['13de3d17-9c97-42aa-b0ef-c96c1740c176']; // user rolü
        autoUserPermissions = [
            'fe5f3cc8-9bd8-47d3-9008-2e8c1234f99d', // profile:view
            '885324e0-d882-452c-aad0-9bb7c940a998', // invoice:read
            'd94dffbc-d560-4f64-bb1a-3ae2361b8f12', // invoice:create
            'e77ed7d3-1995-48a8-8157-72a2169f2a7f', // invoice:update
            '43f2b48c-17de-4570-9b4d-111b9e1d789d', // roles:update
        ];
    } else {
        // Plan eşleşmezse default olarak user rolü ve profile:view izni ata
        console.warn('Plan eşleşmedi, default rol ve izin atanıyor.');
        autoUserRoles = ['13de3d17-9c97-42aa-b0ef-c96c1740c176'];
        autoUserPermissions = ['fe5f3cc8-9bd8-47d3-9008-2e8c1234f99d'];
    }
    // Parametre ile gelenlerle birleştir
    const allUserRoles = [...new Set([...(userroles || []), ...autoUserRoles])];
    const allUserPermissions = [...new Set([...(userpermissions || []), ...autoUserPermissions])];

    console.log('autoUserRoles:', autoUserRoles);
    console.log('autoUserPermissions:', autoUserPermissions);
    console.log('allUserRoles:', allUserRoles);
    console.log('allUserPermissions:', allUserPermissions);

    const durationDays = planInfo.interval === 'monthly' ? 30 : 365;

    const hashedPassword = await bcrypt.hash(password, 12);

    try {
        // 1. User oluştur
        console.log('[registerUser] Creating user...');
        const newUser = await pc.user.create({
            data: {
                firstname,
                lastname,
                email,
                phone,
                password: hashedPassword,
                companyName,
                companyLogoUrl,
                taxId,
                address,
                createdat: new Date(),
                createdby: "b7238edc-7154-4d7a-9ca4-de5a5a6b6aa5",
                planId,
                status: true,
            },
        });
        console.log('[registerUser] User created:', newUser.id);

        // 1.1. User'a rollerini ata (tek tek create ile, eksikse rolü oluştur)
        if (allUserRoles.length > 0) {
            for (const roleid of allUserRoles) {
                try {
                    // Rol veritabanında var mı kontrol et
                    let role = await pc.role.findUnique({ where: { id: roleid } });
                    if (!role) {
                        console.warn(`[registerUser] Rol bulunamadı, ekleniyor: ${roleid}`);
                        role = await pc.role.create({
                            data: {
                                id: roleid,
                                name: 'user', // Varsayılan isim, istersen planName veya başka bir şey kullanabilirsin
                                issystemrole: false,
                                createdat: new Date(),
                                createdby: newUser.id,
                            },
                        });
                    }
                    await pc.userrole.create({
                        data: {
                            userid: newUser.id,
                            roleid,
                            createdby: newUser.id,
                            createdat: new Date(),
                        },
                    });
                } catch (err) {
                    console.error('userrole.create error:', err);
                }
            }
        }
        // 1.2. User'a permissionlarını ata (tek tek create ile, eksikse izin oluştur)
        if (allUserPermissions.length > 0) {
            for (const permissionid of allUserPermissions) {
                try {
                    // Permission veritabanında var mı kontrol et
                    let permission = await pc.permission.findUnique({ where: { id: permissionid } });
                    if (!permission) {
                        console.warn(`[registerUser] Permission bulunamadı, ekleniyor: ${permissionid}`);
                        permission = await pc.permission.create({
                            data: {
                                id: permissionid,
                                name: permissionid, // Varsayılan isim, istersen daha anlamlı bir şey kullanabilirsin
                                value: permissionid,
                                group: 'default',
                                description: 'Otomatik eklenen izin',
                                createdat: new Date(),
                                createdby: newUser.id,
                            },
                        });
                    }
                    await pc.userpermission.create({
                        data: {
                            userid: newUser.id,
                            permissionid,
                            createdby: newUser.id,
                            createdat: new Date(),
                        },
                    });
                } catch (err) {
                    console.error('userpermission.create error:', err);
                }
            }
        }

        // 2. Customer oluştur
        console.log('[registerUser] Creating customer...');
        const newCustomer = await pc.customer.create({
            data: {
                userId: newUser.id,
                name: companyName || firstname + ' ' + lastname,
                email: email,
                createdat: new Date(),
            },
        });
        console.log('[registerUser] Customer created:', newCustomer.id);

        // 3. Invoice oluştur (her durumda)
        const invoiceAmount = parseInt(planInfo.price);
        if (isNaN(invoiceAmount)) {
            console.error('[registerUser] planInfo.price is not a valid number:', planInfo.price);
            throw new Error('planInfo.price is not a valid number');
        }
        const invoiceStatus = paymentStatus === 'paid' ? 'paid' : (paymentStatus === 'free' ? 'free' : 'failed');
        console.log('[registerUser] Creating invoice...');
        const newInvoice = await pc.invoice.create({
            data: {
                title: `Subscription Invoice - ${planInfo.name}`,
                description: `Subscription for plan: ${planInfo.name}`,
                amount: invoiceAmount,
                userId: newUser.id,
                customerId: newCustomer.id,
                createdat: new Date(),
                status: invoiceStatus,
            },
        });
        console.log('[registerUser] Invoice created:', newInvoice.id);

        // 4. Payment oluştur (her durumda)
        console.log('[registerUser] Creating payment...');
        const newPayment = await pc.payment.create({
            data: {
                userId: newUser.id,
                amount: planInfo.price,
                currency: planInfo.currency || 'USD',
                invoiceId: newInvoice.id,
                stripeId: stripeId,
                status: paymentStatus, // 'paid', 'free', 'failed'
                createdat: new Date(),
            },
        });
        console.log('[registerUser] Payment created:', newPayment.id);

        // 5. Subscription oluştur (her durumda)
        const subscriptionStatus = paymentStatus === 'paid' ? 'active' : (paymentStatus === 'free' ? 'trial' : 'failed');
        console.log('[registerUser] Creating subscription...');
        await pc.subscription.create({
            data: {
                userId: newUser.id,
                planId: planId,
                stripeId: stripeId,
                startedat: new Date(),
                endedat: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
                status: subscriptionStatus,
            },
        });
        console.log('[registerUser] Subscription created');

        // 6. Notification oluştur
        console.log('[registerUser] Creating notification...');
        let notificationMsg = `Welcome to Invoice SaaS ${firstname}! Your account has been successfully created.`;
        if (paymentStatus === 'failed') {
            notificationMsg = `Kaydınız oluşturuldu ancak ödeme işleminiz başarısız oldu. Free plan ile devam edebilirsiniz.`;
        } else if (paymentStatus === 'free') {
            notificationMsg = `Free plan ile kaydınız oluşturuldu. Dilediğiniz zaman üst paketlere geçebilirsiniz.`;
        }
        await pc.notification.create({
            data: {
                touserid: newUser.id,
                message: notificationMsg,
                createdby:"b7238edc-7154-4d7a-9ca4-de5a5a6b6aa5",
                url: '/dashboard',
                createdat: new Date(),
            },
        });
        console.log('[registerUser] Notification created');

        // 7. Entrance oluştur
        console.log('[registerUser] Creating entrance...');
        await pc.entrance.create({
            data: {
                userid: newUser.id,
                ipaddress: '22',
                useragent: 'Mozilla/5.0',
                createdat: new Date(),
                type: TransactionType.LOGIN,
            },
        });
        console.log('[registerUser] Entrance created');

        // 8. Transaction tablosuna kayıt at
        console.log('[registerUser] Creating transaction...');
        await pc.transaction.create({
            data: {
                userid: newUser.id,
                type: 0, // 0: LOGIN (TransactionType.LOGIN int karşılığı)
                useragent: 'Mozilla/5.0',
                ipaddress: '22',
                createdat: new Date(),
            },
        });
        console.log('[registerUser] Transaction created');

        // JWT için user'ın rollerini ve izinlerini çek
        const userWithRoles = await pc.user.findUnique({
            where: { id: newUser.id },
            include: {
                userroles: { include: { role: { include: { rolepermissions: { include: { permission: true } } } } } },
                userpermissions: { include: { permission: true } },
            },
        });
        console.log('userWithRoles:', JSON.stringify(userWithRoles, null, 2));
        const roles = userWithRoles?.userroles.map(ur => ur.role.name) || [];
        const permissions = [
            ...(userWithRoles?.userpermissions.map(up => up.permission.value) || []),
            ...((userWithRoles?.userroles || []).flatMap(ur => ur.role.rolepermissions.map(rp => rp.permission.value)))
        ];
        const entitlements = Array.from(new Set(permissions));
        if (roles.length === 0 || entitlements.length === 0) {
            console.error('[registerUser] Roller veya entitlements boş! userWithRoles:', JSON.stringify(userWithRoles, null, 2));
        }

        const jwtPayload = {
            id: newUser.id,
            email: newUser.email,
            firstname: newUser.firstname,
            lastname: newUser.lastname,
            phone: newUser.phone,
            companyName: newUser.companyName,
            companyLogoUrl: newUser.companyLogoUrl,
            taxId: newUser.taxId,
            address: newUser.address,
            planId: newUser.planId,
            status: newUser.status,
            entitlements,
            permissions: entitlements,
            roles,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + parseInt(env.JWT_EXPIRE_MINUTE!) * 60,
            iss: env.JWT_ISS,
            aud: env.JTW_AUD,
            client_id: env.API_CLIENT_ID,
            tokentype: env.LOGIN_TOKEN_TYPE,
        };

        var registerToken = await jwtsign(jwtPayload, env.JWT_SECRET!);

        return { accesstoken: registerToken, tokentype: env.JWT_TOKEN_TYPE, expiresin: jwtPayload.exp };

    } catch (error) {
        console.error('[registerUser] Error during user creation:', error);
        throw new HTTPException(HttpStatusCode.INTERNAL_SERVER_ERROR, { message: 'user_creation_failed' });
    }
}