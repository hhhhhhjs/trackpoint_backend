import { Context, Next } from "koa"
import { v4 as uuidv4 } from 'uuid'
import mysql from '../database/index'
import { IToken } from "../types/token";
import { FieldPacket } from "mysql2";

export const register = async (ctx: Context, next: Next) => {
    // 查询是否存在该用户
    const { username, password } = ctx.request.body

    if (password && username && password.length < 6) {
        ctx.status = 400
        ctx.body = {
            code: -1,
            msg: '密码长度不能小于6位',
            data: null
        }
        return
    }
    try {
        const [rows, fields]: [Array<IToken>, FieldPacket[]] = await mysql.execute('select * from user where username = ?',
            [username]) as [Array<IToken>, FieldPacket[]];

        if (Array.isArray(rows) && rows.length > 0) {
            ctx.status = 409
            ctx.body = {
                code: -1,
                msg: '用户已存在，请使用其他用户名 ಥ_ಥ',
                data: null
            }
            return
        }
        // 获取当前时间
        const currentTime = new Date()
        const result = await mysql.execute('insert into user (userid, username, password, create_at) values (?, ?, ?, ?)',
            [uuidv4(), username, password, currentTime])
            
        console.log(result)
        // 数据插入成功之后再向前端返回数据
        if (result.affectedRows === 1) {
            ctx.status = 200
            ctx.body = {
                code: 0,
                msg: '注册成功',
                data: null
            }
            await next()
        }
    } catch (error) {
        ctx.status = 500
        ctx.body = {
            code: -1,
            msg: '服务器错误',
            data: null
        }
        console.error(error)
        return
    }
}