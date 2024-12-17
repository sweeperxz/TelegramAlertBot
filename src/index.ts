import { Telegraf } from 'telegraf';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { production } from './core';
import { alert, startStatusCheck } from './commands/alert';
import createDebug from 'debug';

const debug = createDebug('bot:index');

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';

const bot = new Telegraf(BOT_TOKEN);

// Логируем запуск бота в Vercel
console.log("Бот запущен...");

bot.command('start', async (ctx) => {
    debug("Запуск проверки статуса...");
    startStatusCheck(ctx); // Передаем ctx для работы
    await ctx.reply("🚀 Бот запущен и начнёт проверять статус тревоги!");
});

// Обработка команды alert
bot.command('alert', alert());

// Запуск бота в продакшн или разработке
if (ENVIRONMENT !== 'production') {
    bot.launch().then(() => {
        console.log('Бот запущен в режиме разработки.');
    });
}

// prod mode (Vercel)
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
    await production(req, res, bot); // Передаем bot для использования в продакшн
};
