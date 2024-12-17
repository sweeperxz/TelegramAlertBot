import { Context } from 'telegraf';
import axios from 'axios';
import createDebug from 'debug';

const debug = createDebug('bot:alert_command');
const CHANNEL_ID = process.env.CHANNEL_ID || ''; // Убедитесь, что этот ID корректный

let cachedStatus: string | null = null; // Переменная для хранения предыдущего статуса
const MAX_RETRIES = 3; // Количество попыток при ошибке запроса

// Функция для получения состояния тревоги
const fetchPoltavaStatus = async (retries = 0): Promise<string> => {
    try {
        const { data } = await axios.get("https://ubilling.net.ua/aerialalerts/", { timeout: 5000 });
        const poltava = data.states?.["Полтавська область"];

        if (!poltava) throw new Error("Не найдены данные о Полтавской области");

        return poltava.alertnow
            ? "🔔 УВАГА! ПОЛТАВСЬКА ОБЛАСТЬ - ПОВІТРЯНА ТРИВОГА!"
            : "🔕 ВІДБІЙ ПОВІТРЯНОЇ ТРИВОГИ!";
    } catch (error: any) {
        if (retries < MAX_RETRIES) {
            debug(`Ошибка запроса, повторная попытка (${retries + 1}): ${error.message}`);
            return fetchPoltavaStatus(retries + 1);
        }
        console.error("Ошибка при запросе данных:", error.message);
        return "❗ Не удалось получить данные о статусе. Попробуйте позже.";
    }
};



const updateStatus = async (ctx: Context) => {
    const statusMessage = await fetchPoltavaStatus();

    if (statusMessage !== cachedStatus) {
        cachedStatus = statusMessage;
        debug(`Статус изменился: ${statusMessage}`);
        await ctx.telegram.sendMessage(CHANNEL_ID, statusMessage);
    } else {
        debug("Статус не изменился, сообщение не отправлено.");
    }
};
const startStatusCheck = (ctx: Context) => {
    debug("Запуск автоматической проверки статуса...");

    setInterval(async () => {
        await updateStatus(ctx);
    }, 20); // Проверка каждые 60 секунд
};

const alert = () => async (ctx: Context) => {
    const statusMessage = await fetchPoltavaStatus();
    debug(`Triggered "alert" command with status message:\n${statusMessage}`);
    await ctx.replyWithMarkdownV2(statusMessage, { parse_mode: 'Markdown' });
};

export { alert, startStatusCheck };
