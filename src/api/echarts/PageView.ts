import mysql from '../../database/index'
import { Context, Next } from 'koa'
import { FieldPacket } from 'mysql2';
import type { Insert_data } from '../../types/insertdata'

interface PvData {
    userid: string;
    username: string;
    page_url: string;
    access_complete_date: string;
    pid?: number;
    access_date?: string;
    access_count?: number;
}

export const reportPV = async (ctx: Context, next: Next) => {

    const { userid, username, page_url, access_complete_date } = ctx.request.body as PvData
    const access_date = access_complete_date.slice(0, 10)

    try {
        // 首先通过 userid 以及 page_url 查询数据库中是否有数据
        const [rows, fields]: [PvData[], FieldPacket[]] = await mysql.execute('select * from pageview where userid =? and page_url =?',
            [userid, page_url]) as [PvData[], FieldPacket[]];

        if (rows.length) {
            // 如果有数据，那么就更新数据
            const [updateRows, updateFields]: [Insert_data, FieldPacket[]] = await mysql.execute('update pageview set  access_date =?, access_complete_date =?, access_count = access_count + 1 where userid =? and page_url =?',
                [access_date, access_complete_date, userid, page_url]) as [Insert_data, FieldPacket[]];
            if (updateRows.affectedRows) {
                ctx.status = 200
                ctx.body = {
                    code: 0,
                    msg: 'pv上报成功',
                    data: null
                }
                return
            }
        }
        if (rows.length === 0) {
            // 如果没有数据，那么就插入数据
            const [insertRows, insertFields]: [Insert_data, FieldPacket[]] = await mysql.execute('insert into pageview (userid, username, page_url, access_date, access_complete_date, access_count) values (?,?,?,?,?,?)',
                [userid, username, page_url, access_date, access_complete_date, 1]) as [Insert_data, FieldPacket[]];

            if (insertRows.affectedRows) {
                ctx.status = 200
                ctx.body = {
                    code: 0,
                    msg: 'pv上报成功',
                    data: null
                }
                return
            }
        }
    } catch (error) {
        console.log(error)
        throw error
    } finally {
        await next()
    }
}


// const IntegrateData = (data: PvData[]) => {
//     const result = [] as Array<{
//         page_url: string;
//         access_count: number; 
//     }>
//     for(let item of data) {
//         const { page_url, access_count } = item
//     }
// }

// 数据整合
const handleData = (data: PvData[]) => {
    const result = [] as Array<{
        page_url: string;
        access_count: number; 
    }>
    
    const map = new Map<string, number>()
    
    for(let item of data) {
        const { page_url, access_count } = item
        if(map.has(page_url)) {
            map.set(page_url, map.get(page_url)! + access_count!)
        } else {
            map.set(page_url, access_count!)
        }
    }
    
    map.forEach((value, key) => {
        result.push({
            page_url: key,
            access_count: value
        })
    })
    
    return result
}


export const getPageView = async (ctx: Context, next: Next) => {
    try {
        const { start_date, end_date } = ctx.request.query
        const selectStart = start_date?.slice(0, 10)
        const selectEnd = end_date?.slice(0, 10)

        const [rows, fields]: [PvData[], FieldPacket[]] = await mysql.execute('select * from pageview where access_date between? and?',
            [selectStart, selectEnd]) as [PvData[], FieldPacket[]];

        if (rows.length) {
            const result = handleData(rows)
            ctx.status = 200
            ctx.body = {
                code: 0,
                msg: '查询成功',
                data: result
            }
        }
    } catch (error) {
        console.log(error)
        throw error
    } finally {
        await next()
    }
}

