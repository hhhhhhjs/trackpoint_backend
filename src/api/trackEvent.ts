// 埋点事件接口
import { FieldPacket } from 'mysql2';
import mysql from '../database/index'
import { Context, Next } from 'koa'
import type { Insert_data } from '../types/insertdata'


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
    const req: reqMessage[] = ctx.request.body
    try {
        // 批量插入数据，减少 I/O 操作次数，提高性能

        const VALUES = req.map((item) => [item.userid, item.eventType, item.timestamp, JSON.stringify(item.event_data), item.page_url])
        const [rows, fields]: [Insert_data, FieldPacket[]] = await mysql.query('INSERT INTO track_event (userid, event_type, timestamp, event_data, page_url) VALUES ?', [VALUES]) as [Insert_data, FieldPacket[]]
        if (rows.affectedRows) {
            ctx.status = 200
            ctx.body = {
                code: 0,
                msg: '埋点事件上报成功',
                data: null
            }
        }

        //TODO:后端重复埋点事件处理
    } catch (error) {
        ctx.status = 500
        ctx.body = {
            code: -1,
            msg: '服务器错误',
            data: null
        }
        throw error
    } finally {
        await next()
    }
}