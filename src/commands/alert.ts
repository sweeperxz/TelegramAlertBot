import { Context } from 'telegraf';
import axios from 'axios';
import createDebug from 'debug';

const debug = createDebug('bot:alert_command');
const CHANNEL_ID = process.env.CHANNEL_ID || ''; // Убедитесь, что этот ID корректный

let cachedStatus: string | null = null; // Переменная для хранения предыдущего статуса

// Функция для получения состояния тревоги
const fetchPoltavaStatus = async (): Promise<string> => {
    try {
        const { data } = await axios.get("https://ubilling.net.ua/aerialalerts/");
        const poltava = data.states["Полтавська область"];
        return poltava.alertnow
            ? "🔔УВАГА! ПОЛТАВСЬКА ОБЛАСТЬ - ПОВІТРЯНА ТРИВОГА! РАКЕТНА НЕБЕЗПЕКА!"
            : "🔕УВАГА! ПОЛТАВСЬКА ОБЛАСТЬ - ВІДБІЙ ПОВІТРЯНОЇ ТРИВОГИ ЗА ВСІМА НАПРЯМКАМИ!";
    } catch (error: any) {
        console.error("Ошибка при запросе данных:", error.message);
        return "Не удалось получить данные о статусе.";
    }
};


const updateStatus = async (ctx: Context) => {
    try {
        const statusMessage = await fetchPoltavaStatus();
        if (statusMessage !== cachedStatus) { 
            cachedStatus = statusMessage;
            debug(`Статус изменился. Отправка нового сообщения: ${statusMessage}`);
            await ctx.telegram.sendMessage(CHANNEL_ID, statusMessage); 
        } else {
            debug("Статус не изменился, не отправляю сообщение.");
        }
    } catch (error: any) {
        console.error("Ошибка при обновлении статуса:", error.message);
        await ctx.reply('Произошла ошибка при обновлении статуса.');
    }
};

const startStatusCheck = (ctx: Context) => {
    debug("Запуск проверки статуса...");

    setInterval(async () => {
        try {
            debug("Проверка статуса...");
            await updateStatus(ctx); 
        } catch (error) {
            console.error("Ошибка при вызове updateStatus:", error);
        }
    }, 15000); 
};

const alert = () => async (ctx: Context) => {
    const statusMessage = await fetchPoltavaStatus();
    debug(`Triggered "alert" command with status message:\n${statusMessage}`);
    await ctx.replyWithMarkdownV2(statusMessage, { parse_mode: 'Markdown' });
};

export { alert, startStatusCheck };
