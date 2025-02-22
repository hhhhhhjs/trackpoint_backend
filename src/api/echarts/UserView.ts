import mysql from '../../database/index'
import { Context, Next } from 'koa'
import { FieldPacket } from 'mysql2';


interface User {
    userid: string;
    username: string;
    password: string;
    create_at: string | null;
    update_at: string | null;
}


export const reportUV = async (ctx: Context, next: Next) => {
   const res = ctx.request.body
   console.log(res) 
   ctx.status = 200
   ctx.body = {
    code: 0,
    msg: '上报成功',
    data: null
   }
}




// TODO: 修改
export const getUserView = async (ctx: Context, next: Next) => {
    try {
        // 查询 user 表
        const [rows, fields]: [User[], FieldPacket[]] = await mysql.query('SELECT * FROM user') as [User[], FieldPacket[]];
        if(rows.length) {
            ctx.body = {
                code: 0,
                msg: '查询成功',
                data: {
                    data: rows,
                    usernums: rows.length
                }
            }
        }

    } catch (error) {
        console.log(error)
        throw error
    } finally {
        await next()
    }
}