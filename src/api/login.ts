import { Context, Next } from "koa";
import mysql from '../database/index'
import { createToken } from "../middleware/createtoken";
import { IToken } from "../types/token";
import { FieldPacket } from "mysql2";

export const login = async(ctx: Context, next: Next) => {
    const { username, password } = ctx.request.body
    // 从数据库中查询用户信息
    const [rows, fields]: [IToken[], FieldPacket[]] = await mysql.execute('select * from user where username = ? and password = ?', 
        [username, password]) as [IToken[], FieldPacket[]]; //将其断言为 IToken[] 类型
    if(Array.isArray(rows) && rows.length === 0){
        ctx.status = 401
        ctx.body = {
            code: -1,
            msg: '用户名或密码错误',
            data: null
        }
        return
    }else {
        // 如果登录成功，将用户信息存储到session中
        // ctx.session.user = rows[0]
        // ctx.session.isLogin = true
        const tokenObj = {
            userid: rows[0].userid,
            username: rows[0].username
        }
        const token = createToken(tokenObj)
        ctx.status = 200
        ctx.body = {
            code: 0,
            msg: '登录成功',
            data: {
                token,
                userid: rows[0].userid
            }
        }
        await next()
    }
}