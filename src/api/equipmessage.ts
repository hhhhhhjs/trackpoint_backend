import { Context, Next } from "koa";
import mysql from '../database/index'
import type { equip, table_equip, Instert_equip } from "../types/equipment";
import { FieldPacket } from "mysql2";

// 处理用户设备信息
export const handleUserDevice = async (ctx: Context, next: Next) => {

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

        console.log('map', map.get('os'))

        // 查找是否存在该用户的设备信息
        const [isrows, isfields]: [equip[], FieldPacket[]] = await mysql.execute('select * from user_equipment where userid =?',
            [userid]) as [equip[], FieldPacket[]]

        // 存在该用户，判断用户是否更新设备信息

        const isuserUpdate = async() => {
            console.log('看看isrows',isrows)
            console.log(isrows[0])
            
            const current_isrows = isrows[0] as table_equip // 将 isrows 断言为 table_equip 类型

            // 前端传递的参数中不存咋 eid, 考虑将其过滤掉
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
            console.log('用户是否更新设备信息',count)

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
                const [update_rows, update_fields]: [Instert_equip, FieldPacket[]] = await mysql.execute('UPDATE user_equipment SET os = ?, browser = ?, device_type = ?, browser_language = ? WHERE userid = ?',
                    [os, browser, device_type, browser_language, userid]) as [Instert_equip, FieldPacket[]]
                    
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
            const [rows, fields]: [Instert_equip, FieldPacket[]] = await mysql.execute('INSERT INTO user_equipment (userid, os, browser, device_type, browser_language) VALUES (?, ?, ?, ?, ?)',
                [userid, os, browser, device_type, browser_language]) as [Instert_equip, FieldPacket[]]

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