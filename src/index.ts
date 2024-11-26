import { Telegraf } from 'telegraf';

import { greeting } from './text';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { development, production } from './core';
import {alert, startStatusCheck} from "./commands/alert";
import {debug} from "debug";

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';

const bot = new Telegraf(BOT_TOKEN);

// Стартуем автоматическую проверку статуса после запуска бота
bot.hears('/start', (ctx) => {  // Слушаем команду или текст "start"
    debug("Бот запущен и будет автоматически обновлять статус Полтавской области.");
    startStatusCheck(ctx); 
    debug('Бот запущен и будет автоматически обновлять статус Полтавской области.');
});

// Команды
bot.command('alert', alert());
bot.on('message', greeting());



//prod mode (Vercel)
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
    await production(req, res, bot);
};

// dev mode
ENVIRONMENT !== 'production' && development(bot);

