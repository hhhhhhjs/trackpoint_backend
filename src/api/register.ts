import { Context, Next } from "koa"
import { v4 as uuidv4 } from 'uuid'
import mysql from '../database/index'

export const register = async (ctx: Context, next: Next) => {
    // 查询是否存在该用户
    const { username, password } = ctx.request.body
    const [rows, fields] = await mysql.execute('select * from user where username = ?', [username])

    if (password && username && password.length < 6) {
        ctx.status = 400
        ctx.body = {
            code: -1,
            msg: '密码长度不能小于6位',
            data: null
        }
        return
    } else if (Array.isArray(rows) && rows.length > 0) {
        ctx.status = 400
        ctx.body = {
            code: -1,
            msg: '用户已存在',
            data: null
        }
        return
    } else {
        const result = await mysql.execute('insert into user (userid, username, password) values (?, ?, ?)', [uuidv4(), username, password])
        // 数据插入成功之后再向前端返回数据
        if (result[0].affectedRows === 1) {
            ctx.status = 200
            ctx.body = {
                code: 0,
                msg: '注册成功',
                data: null
            }
            await next()
        }
    }
}