import { Context, Next } from "koa";
import mysql from '../database/index'
import type { equip, table_equip } from "../types/equipment";
import type { Insert_data } from "../types/insertdata";
import { FieldPacket } from "mysql2";

// 处理用户设备信息
export const handleUserDevice = async (ctx: Context, next: Next) => {
    const upload_time = new Date()
    try {
        // 向数据库插入相关数据
        const request: equip = ctx.request.body

        const { userid, os, browser, device_type, browser_language } = request

        // 如果统计的信息量很大，不可能一直使用 && 运算符进行判断，考虑使用 map 提升性能
        const map = new Map()
        let count = 0
        for (let char in request) {
            if (request[char as keyof equip]) {
                map.set(char, request[char as keyof equip])
            }
        }

        // 查找是否存在该用户的设备信息
        const [isrows, isfields]: [equip[], FieldPacket[]] = await mysql.execute('select * from user_equipment where userid =?',
            [userid]) as [equip[], FieldPacket[]]

        // 存在该用户，判断用户是否更新设备信息

        const isuserUpdate = async() => {
            const current_isrows = isrows[0] as table_equip // 将 isrows 断言为 table_equip 类型

            // 前端传递的参数中不存在 eid, 考虑将其过滤掉
            delete current_isrows.eid

            for (let char in current_isrows) {
                if (current_isrows[char as keyof equip] === map.get(char)) {
                    count += 1
                } else {
                    count = 0
                    return
                }
            }
        }

        // 存在该用户，判断用户是否更新设备信息
        if (isrows.length > 0) {
            await isuserUpdate()

            // 如果为 true，说明用户没有更新设备信息，不需要再次插入数据
            if(count){
                ctx.status = 200
                ctx.body = {
                    code: 0,
                    msg: '该用户已存在，且设备信息未更新',
                    data: null
                }
                await next()
                return
            }
            // 如果为 false，说明用户更新了设备信息，需要更新数据
            if (!count) {
                const [update_rows, update_fields]: [Insert_data, FieldPacket[]] = await mysql.execute('UPDATE user_equipment SET os = ?, browser = ?, device_type = ?, browser_language = ?, upload_time = ? WHERE userid = ?',
                    [os, browser, device_type, browser_language, upload_time, userid]) as [Insert_data, FieldPacket[]]
                    
                if (update_rows.affectedRows) {
                    ctx.status = 200
                    ctx.body = {
                        code: 0,
                        msg: '该用户已存在，且设备信息已更新',
                        data: null
                    }
                    await next()
                    return 
                }
            }
        }


        // 如果不存在该用户，插入数据
        if (isrows.length === 0) {
            const [rows, fields]: [Insert_data, FieldPacket[]] = await mysql.execute('INSERT INTO user_equipment (userid, os, browser, device_type, browser_language, upload_time) VALUES (?, ?, ?, ?, ?, ?)',
                [userid, os, browser, device_type, browser_language, upload_time]) as [Insert_data, FieldPacket[]]

            if (rows.affectedRows) {
                ctx.status = 200
                ctx.body = {
                    code: 0,
                    msg: '成功获取设备信息',
                    data: null
                }
                await next()
            }
        }

    } catch (error) {
        ctx.status = 500
        ctx.body = {
            code: -1,
            msg: '服务器错误',
            data: null
        }
        console.error(error)
    }
}


// 拿到用户信息
export const geteUserDevice = async(ctx:Context, next:Next) => {
    const userid = ctx.query.userid as string
    // 查询数据库
    try {
        const [rows, fields]: [equip[], FieldPacket[]] = await mysql.execute('select * from user_equipment where userid =?',
            [userid]) as [equip[], FieldPacket[]]
        if (rows.length > 0) {
            ctx.status = 200
            ctx.body = {
                code: 0,
                msg: '成功获取设备信息',
                data: rows[0]
            }
            await next()
        }
    }catch(error){
        ctx.status = 500
        ctx.body = {
            code: -1,
            msg: '服务器错误',
            data: null
        } 
    }
}