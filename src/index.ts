import 'dotenv/config';
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import { stripe } from './stripe';
import { bot, sendTutorial } from './bot';
import { prisma } from './prisma';
import path from 'node:path';

const app = express();

app.use(cors());

app.use('/static', express.static(path.resolve(__dirname, '..', 'static')));

app.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const payload = req.body;
    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
        console.error('Error verifying Stripe webhook:', error);
        return res.sendStatus(400);
    }

    if (event.type === 'payment_intent.succeeded') {
        const customer = await prisma.customers.findFirst({
            where: {
                paymentGatewayId: event.data.object['customer'] as string,
            }
        });

        if (customer) {
            customer.credits = customer.credits + 5;
            const isNewCustomer = customer.isNew;

            await prisma.customers.update({
                where: {
                    id: customer.id,
                },
                data: {
                    credits: customer.credits,
                    isNew: false,
                },
            });

            await bot.sendMessage(customer.chatId, '✅ Pagamento recebido com sucesso!');

            if (isNewCustomer) {
                await sendTutorial(customer.chatId);
            }

            return res.sendStatus(200);
        }

        return res.sendStatus(400);
    }
});

app.get('/order/success', express.json(), async (req, res) => {
    res.send(`<html><body><h1>Thanks for your order!</h1></body></html>`);
});

app.listen(3000, () => console.log('Server running on port 3000'));
bot.startPolling();

