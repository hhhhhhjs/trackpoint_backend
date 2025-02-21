import mysql from '../database/index'
import { Context, Next } from 'koa'
import { __dirname } from './filepath/getFilePath'
import { FieldPacket } from 'mysql2'
import { Insert_data } from '../types/insertdata'
import fs from 'node:fs'

interface uploadFiles extends File {
    newFilename?: string;
    originalFilename?: string;
    filepath?: string;
    path?: string;
    selfname?: string;
}

interface avatarData {
    pid: number;
    userid: string;
    avatar_path: string;
    complete_path: string;
}

export const uploadAvatar = async (ctx: Context, next: Next) => {
    const { userid } = ctx.request.query
    const file = ctx.request.files?.avatar as uploadFiles | undefined;
    const avatar_path = file?.filepath
    const fileUrl = file?.selfname
    if (!file) {
        ctx.status = 400
        ctx.body = {
            code: -1,
            msg: '头像不存在',
            data: null
        }
        return
    }

    try {
        // 通过 userid 查询 avatar 表
        const [rows, fields]: [avatarData[], FieldPacket[]] = await mysql.execute('select * from avatar where userid =?',
            [userid]) as [avatarData[], FieldPacket[]];

        // 如果当前用户还没有头像数据
        if (rows.length === 0 && fileUrl) {
            // 插入数据

            const [insertRows, insertFields]: [Insert_data, FieldPacket[]] = await mysql.execute('insert into avatar (userid, avatar_path, complete_path) values (?,?,?)',
                [userid, fileUrl, avatar_path]) as [Insert_data, FieldPacket[]];
            if (insertRows.affectedRows) {
                ctx.status = 200
                ctx.body = {
                    code: 0,
                    msg: '头像设置成功',
                    data: null
                }
                return
            }
        }

        // 如果当前用户已经有头像数据，那么说明用户正在修改头像，那么就需要先删除旧的头像，再插入新的头像
        if (rows.length > 0 && avatar_path && fileUrl) {
            // 拿到旧的头像路径
            const oldAvatarPath = rows[0].complete_path
            
            // 删除旧的图片

            // 删除完毕之后在进行下面操作
            if (oldAvatarPath) {
                fs.unlinkSync(oldAvatarPath)
            }

            // 更新数据库图片路径
            const [updatetRows, updateFields]: [Insert_data, FieldPacket[]] = await mysql.execute('update avatar set avatar_path =?, complete_path =? where userid =?',
                [fileUrl, avatar_path, userid]) as [Insert_data, FieldPacket[]];
            if (updatetRows.affectedRows) {
                ctx.status = 200
                ctx.body = {
                    code: 0,
                    msg: '头像重置成功',
                    data: null
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



export const getAvatar = async (ctx: Context, next: Next) => {
    const { userid } = ctx.request.query

    try {
        const [rows, fields]: [avatarData[], FieldPacket[]] = await mysql.execute('select * from avatar where userid =?',
            [userid]) as [avatarData[], FieldPacket[]];   

        if (rows.length > 0) {
            const fileUrl = rows[0].avatar_path
            ctx.status = 200
            ctx.body = {
                code: 0,
                msg: '头像查询成功',
                data: {
                    avatar: fileUrl
                }
            }  
        }
        
        if(rows.length === 0) {
            ctx.status = 200
            ctx.body = {
                code: 0,
                msg: '该用户暂未上传头像',
                data: {
                    avatar: ''
                }
            }
        }
    
    } catch (error) {
        throw error 
    } finally {
        await next()
    }
}