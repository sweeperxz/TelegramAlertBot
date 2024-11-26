import { Context } from 'telegraf';
import axios from 'axios';
import createDebug from 'debug';

const debug = createDebug('bot:alert_command');

let cachedStatus: string | null = null;
const CHANNEL_ID = process.env.CHANNEL_ID || '';


const fetchPoltavaStatus = async (): Promise<string> => {
    try {
        const { data } = await axios.get("https://ubilling.net.ua/aerialalerts/");
        const poltava = data.states["Полтавська область"];
        return poltava.alertnow ? "🔔УВАГА! ПОЛТАВСЬКА ОБЛАСТЬ - ПОВІТРЯНА ТРИВОГА! РАКЕТНА НЕБЕЗПЕКА!" : "🔕УВАГА! ПОЛТАВСЬКА ОБЛАСТЬ - ВІДБІЙ ПОВІТРЯНОЇ ТРИВОГИ ЗА ВСІМА НАПРЯМКАМИ!";
    } catch (error: any) {
        console.error("Ошибка при запросе данных:", error.message);
        return "Не удалось получить данные о статусе.";
    }
};

const updateStatus = async (ctx: Context) => {
    try {
        const statusMessage = await fetchPoltavaStatus();
        if (statusMessage !== cachedStatus) { // Проверяем, изменился ли статус
            cachedStatus = statusMessage;
            debug(`Status updated. Sending new message:\n${statusMessage}`);
            await ctx.telegram.sendMessage(CHANNEL_ID, statusMessage);
        }
    } catch (error: any) {
        console.error("Ошибка при обновлении статуса:", error.message);
        await ctx.reply('Произошла ошибка при обновлении статуса.');
    }
};

// Обработчик команды /alert
const alert = () => async (ctx: Context) => {
    const statusMessage = await fetchPoltavaStatus();
    debug(`Triggered "alert" command with status message:\n${statusMessage}`);
    await ctx.replyWithMarkdownV2(statusMessage, { parse_mode: 'Markdown' });
};

// Запуск проверки статуса каждые 60 секунд
const startStatusCheck = (ctx: Context) => {
    setInterval(() => updateStatus(ctx), 10000); // Проверка каждые 60 секунд
};

export { alert, startStatusCheck };
