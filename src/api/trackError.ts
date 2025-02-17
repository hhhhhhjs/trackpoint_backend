import mysql from '../database/index'
import { Context, Next } from 'koa'
import type { Insert_data } from '../types/insertdata'
import type { FieldPacket } from 'mysql2'

interface reqMessage {
    errorType: string;
    data: {
        source?: string;
        lineno?: number;
        colno?: number;
        error?: Error;
        stack?: string;
    };
    timestamp: number;
}

export const trackError = async (ctx: Context, next: Next) => {
    const req: reqMessage[] = ctx.request.body
    try {
        // 批量插入错误数据
        const VALUES = req.map((item) => [item.errorType, JSON.stringify(item.data), item.timestamp])
        const [insertRows, insertFields]: [Insert_data, FieldPacket[]] = await mysql.query('INSERT INTO track_error (error_type, error_data, timestamp) VALUES ?',
            [VALUES]) as [Insert_data, FieldPacket[]]
        if (insertRows.affectedRows) {
            ctx.status = 200
            ctx.body = {
                code: 0,
                msg: '错误数据插入成功',
                data: null
            }
        }
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
