import { VercelRequest, VercelResponse } from '@vercel/node';
import createDebug from 'debug';
import { Context, Telegraf } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';

const debug = createDebug('bot:dev');

// Порт для сервера (Vercel автоматически настроит порт)
const PORT = (process.env.PORT && parseInt(process.env.PORT, 10)) || 3000;
const VERCEL_URL = process.env.VERCEL_URL; // URL для webhook, предоставленный Vercel

const production = async (
    req: VercelRequest,
    res: VercelResponse,
    bot: Telegraf<Context<Update>>,  // bot — объект Telegraf, а не Context
) => {
  debug('Bot runs in production mode');

  // Проверка наличия переменной VERCEL_URL
  if (!VERCEL_URL) {
    debug('VERCEL_URL is not set.');
    res.status(500).send('VERCEL_URL is not set.');
    return;
  }

  debug(`Setting webhook: ${VERCEL_URL}/api`);

  try {
    // Получаем текущую информацию о webhook
    const getWebhookInfo = await bot.telegram.getWebhookInfo();

    // Если текущий URL webhook отличается от нужного, удаляем старый и устанавливаем новый
    if (getWebhookInfo.url !== `${VERCEL_URL}/api`) {
      debug(`Deleting old webhook: ${getWebhookInfo.url}`);
      await bot.telegram.deleteWebhook();
      debug(`Setting new webhook: ${VERCEL_URL}/api`);
      await bot.telegram.setWebhook(`${VERCEL_URL}/api`);
    } else {
      debug('Webhook is already set correctly.');
    }

    // Обрабатываем запросы от Telegram через webhook
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body as Update, res);
    } else {
      res.status(200).json('Listening to bot events...');
    }
  } catch (error) {
    debug('Error occurred while handling webhook:', error);
    res.status(500).send('Internal Server Error');
  }

  debug(`Webhook set on ${VERCEL_URL}/api`);
};

export { production };
