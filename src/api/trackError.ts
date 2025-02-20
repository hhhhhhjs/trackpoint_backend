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
    count?: number;
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

export const getError = async (ctx: Context, next: Next) => {
    try {
        // 分页查询
        const { page, pageSize: limit } = ctx.query
        // 偏移量
        const offset = (Number(page) - 1) * Number(limit)

        // 分页查询
        const [rows, fields]: [reqMessage[], FieldPacket[]] = await mysql.query(
            'SELECT * FROM track_error LIMIT ? OFFSET ?', // 这里 sql 不允许将 offset 写在 limit 前面
            [Number(limit), offset]
        ) as [reqMessage[], FieldPacket[]];

        // 获取总行数
        const [totalRows, totalRowsFields]: [reqMessage[], FieldPacket[]] = await mysql.query(
            'SELECT COUNT(*) AS count FROM track_error') as [reqMessage[], FieldPacket[]]
        if (rows.length && totalRows[0].count) {
            ctx.status = 200
            ctx.body = {
                code: 0,
                msg: '错误数据查询成功',
                data: {
                    list: rows,
                    total: totalRows[0].count
                }
            }
        }
    } catch (error) {
        ctx.status = 500
        ctx.body = {
            code: -1,
            msg: '服务器错误',
            data: null
        }
        console.log(error)
    } finally {
        await next()
    }
}