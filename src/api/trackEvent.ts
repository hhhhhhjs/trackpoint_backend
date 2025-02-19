import { FieldPacket } from 'mysql2';
import mysql from '../database/index';
import { Context, Next } from 'koa';
import { consolidateEvents } from './trackEventMethod/integrageData';

interface reqMessage {
    userid: string;
    eventType: string;
    timestamp?: number;
    event_data: {
        elementText: string;
        elementTag: string;
    };
    page_url: string;
    count?: number;
}

export const trackEvent = async (ctx: Context, next: Next) => {
    const req: reqMessage[] = ctx.request.body;

    try {
        // 首先遍历请求，查看是否有相同的数据


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

        // 处理队列中的相同数据
        const newUpdate = consolidateEvents(toUpdate.map(item => ({ ...item, timestamp: item.timestamp || 0 })));
        const newInsert = consolidateEvents(toInsert.map(item => ({ ...item, timestamp: item.timestamp || 0 })));

        // 批量更新
        if (newUpdate.length > 0) {
            const updatePromises = newUpdate.map(async (item) => {
                await mysql.execute(
                    'UPDATE track_event SET track_nums = track_nums + ? WHERE userid = ? AND event_type = ? AND JSON_CONTAINS(event_data, ?) AND page_url = ?',
                    [item.count, item.userid, item.eventType, JSON.stringify(item.event_data), item.page_url]
                );
            });
            await Promise.all(updatePromises);
        }


        // 批量插入
        if (newInsert.length > 0) {
            const insertValues = newInsert.map((item) => [
                item.userid,
                item.eventType,
                item.timestamp,
                item.count,
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


export const getEvent = async (ctx: Context, next: Next) => {
    try {
        const res = ctx.request.query
        // 通过 userid 查询 track_event 表中的所有数据
        const [rows]: [reqMessage[], FieldPacket[]] = await mysql.execute(
            'SELECT * FROM track_event WHERE userid = ?',
            [res.userid]
        ) as [reqMessage[], FieldPacket[]];
        if (rows.length === 0) {
            ctx.status = 404;
            ctx.body = {
                code: -1,
                msg: '没有该用户的埋点数据',
                data: null,
            };
        }
        ctx.status = 200;
        ctx.body = {
            code: 0,
            msg: '获取埋点数据成功',
            data: rows,
        };

    } catch (error) {
        ctx.status = 500;
        ctx.body = {
            code: -1,
            msg: '服务器错误',
            data: null,
        };
    } finally {
        await next();
    }
}