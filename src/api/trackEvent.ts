import { FieldPacket } from 'mysql2';
import mysql from '../database/index';
import { Context, Next } from 'koa';

interface reqMessage {
    userid: string;
    eventType: string;
    timestamp: Date;
    event_data: {
        elementText: string;
        elementTag: string;
    };
    page_url: string;
}

export const trackEvent = async (ctx: Context, next: Next) => {
    const req: reqMessage[] = ctx.request.body;

    try {
        // 批量查找：检查每个请求是否已存在
        const checkPromises = req.map(async (item) => {
            // 数据库查询请求，多个并发，考虑封装为 promise
            const [rows]: [reqMessage[], FieldPacket[]] = await mysql.execute(
                'SELECT * FROM track_event WHERE userid = ? AND event_type = ? AND JSON_CONTAINS(event_data, ?) AND page_url = ?',
                [item.userid, item.eventType, JSON.stringify(item.event_data), item.page_url]
            ) as [reqMessage[], FieldPacket[]];
            return { item, exists: rows.length > 0 };
        });

        const checkResults = await Promise.all(checkPromises);

        // 分离需要更新和插入的数据
        const toUpdate = checkResults.filter(result => result.exists).map(result => result.item);
        const toInsert = checkResults.filter(result => !result.exists).map(result => result.item);

        // 批量更新
        if (toUpdate.length > 0) {
            const updatePromises = toUpdate.map(async (item) => {
                await mysql.execute(
                    'UPDATE track_event SET track_nums = track_nums + 1 WHERE userid = ? AND event_type = ? AND JSON_CONTAINS(event_data, ?) AND page_url = ?',
                    [item.userid, item.eventType, JSON.stringify(item.event_data), item.page_url]
                );
            });
            await Promise.all(updatePromises);
        }

        // 批量插入
        if (toInsert.length > 0) {
            const insertValues = toInsert.map((item) => [
                item.userid,
                item.eventType,
                item.timestamp,
                1, // track_nums 初始值为 1
                JSON.stringify(item.event_data),
                item.page_url,
            ]);
            await mysql.query(
                'INSERT INTO track_event (userid, event_type, timestamp, track_nums, event_data, page_url) VALUES ?',
                [insertValues]
            );
        }

        ctx.status = 200;
        ctx.body = {
            code: 0,
            msg: '埋点事件上报成功',
            data: null,
        };
    } catch (error) {
        ctx.status = 500;
        ctx.body = {
            code: -1,
            msg: '服务器错误',
            data: null,
        };
        throw error;
    } finally {
        await next();
    }
};