import TelegramBot from 'node-telegram-bot-api';
import { stripe } from './stripe';
import { prisma } from './prisma';
import { imageGenerator } from './image-generator';

const bot = new TelegramBot(process.env.BOT_TOKEN);

const sendTutorial = async (chatId: string) => {
    await bot.sendMessage(chatId, '👉 Para gerar logos pro seu time, copie a seguinte mensagem preenchendo os campos solicitados:\n');
    const message = `/logo\n\n* 🐶 Mascote [em inglês]: \n- {pomeranian}\n\n* 📝 Iniciais do time [duas letras]:\n- {PM}`
    await bot.sendMessage(chatId, message);

    await bot.sendPhoto(chatId, process.env.APP_URL + '/static/logo.png');
    await bot.sendMessage(chatId, 'Logo gerada a partir do mascote "pomeranian" (raça de cachorro lulu da pomerânia, em inglês) e das iniciais PM 👆');
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    if (msg.text === '/start') {
        try {
            let customer = await prisma.customers.findFirst({
                where: {
                    chatId: chatId.toString(),
                },
            })

            if (!customer || customer.credits === 0) {
                if (!customer) {
                    const stripeCustomerId = await stripe.customers.create({
                        name: msg.from.username,
                    });

                    customer = await prisma.customers.create({
                        data: {
                            chatId: chatId.toString(),
                            paymentGatewayId: stripeCustomerId.id,
                        },
                    });
                }

                const paymentLink = await stripe.checkout.sessions.create({
                    customer: customer.paymentGatewayId,
                    line_items: [
                        {
                            price: process.env.STRIPE_PRICE_ID,
                            quantity: 1,
                        },
                    ],
                    payment_method_types: [
                        'card',
                    ],
                    mode: 'payment',
                    success_url: `${process.env.APP_URL}/order/success`,
                });

                await bot.sendMessage(chatId, '👋 Olá, seja bem-vindo ao nosso bot gerador de logos pro seu time de E-Sports\n');
                await bot.sendMessage(chatId, '🎮 Para gerar 10 logos pro seu time, você precisa pagar uma taxa de R$ 5,00\n');
                await bot.sendMessage(chatId, `💳 Pague com o seguinte link: \n\n${paymentLink.url}`);
                return;
            }

            await bot.sendMessage(chatId, '👋 Olá, seja bem-vindo ao nosso bot gerador de logos pro seu time de E-Sports\n');
            await bot.sendMessage(chatId, `🎮 Você tem ${customer.credits} créditos para gerar logos pro seu time\n`);
            await bot.sendMessage(chatId, '👉 Para gerar logos pro seu time, copie a seguinte mensagem preenchendo os campos solicitados\n');
            const message = `/logo\n🐶 Mascote (Em inglês): Ex pomeranian (nome de uma raça de cachorro)\n📝 Iniciais do time (duas letras): ex PM`
            await bot.sendMessage(chatId, message);
        } catch (error) {
            console.error('Error creating payment:', error);
        }
    }

    if (msg.text.includes('/logo')) {
        try {
            const customer = await prisma.customers.findFirst({
                where: {
                    chatId: chatId.toString(),
                },
            });

            if (!customer || customer.credits === 0) {
                await bot.sendMessage(
                    chatId,
                    '❌ Você não tem créditos suficientes para gerar logos pro seu time\n📲 Clique aqui para recarregar 👉 /start'
                );
                return;
            }

            const regex = /{([^}]+)}/g;
            const matches = String(msg.text).match(regex);
            const [pet, letters] = matches.map(m => m.replace(/[\{\}]/g, ''));

            if (!pet || !letters) {
                await bot.sendMessage(chatId, '❌ Você precisa preencher os campos solicitados');
                return;
            }

            if (letters && letters.length > 2) {
                await bot.sendMessage(chatId, '❌ As iniciais do time precisam ter no maximo duas letras');
                return;
            }

            const prompt = `Vectorial e-sports Logo for a team with a ${pet} as a pet in the center of a circle ${letters?.length && `and the letters ${letters[0]} and ${letters[1]} in the below part of the circle`}. Avoid wrong written words, wrong spelled words and no words written when requested`

            await bot.sendMessage(chatId, '🔥 Gerando logo...');

            try {
                const imageName = await imageGenerator.generate(prompt);


                customer.credits = customer.credits - 1;

                await prisma.customers.update({
                    where: {
                        id: customer.id,
                    },
                    data: {
                        credits: customer.credits,
                    },
                });

                await bot.sendPhoto(chatId, process.env.APP_URL + '/static/' + imageName);
            } catch (error) {
                console.error('Error generating logo:', error);
                await bot.sendMessage(chatId, '❌ Erro ao gerar logo');
            }
        } catch (error) {
            console.error('Error creating logo:', error);
        }
    }
});

export { bot, sendTutorial };
