import mysql from '../../database/index'
import { Context, Next } from 'koa'
import { FieldPacket } from 'mysql2';
import { Insert_data } from '../../types/insertdata'

interface User {
    userid: string;
    username: string;
    password: string;
    create_at: string | null;
    update_at: string | null;
}


interface UserVisit {
    Uid?: number;
    userid: string;
    username: string;
    visit_date: string;
    visit_time: string;
}

interface DailyUV {
    date: string;
    usernums: number;
}


export const reportUV = async (ctx: Context, next: Next) => {
    const res = ctx.request.body
    const { userid, username, visit_date:visit_time } = res
    const visit_date = new Date(visit_time).toISOString().slice(0, 10)
    try {

        // 查询数据库中该用户是否在今天登录过
        // 这里默认只统计用户当天第一次登录的时间
        const [rows, fields]: [User[], FieldPacket[]] = await mysql.execute('select * from userview where userid =? and visit_date =?',
            [userid, visit_date]) as [User[], FieldPacket[]];

        if(rows.length > 0){
            ctx.status = 200
            ctx.body = {
                code: 0,
                msg: '该用户今日已上报',
                data: null
            } 
            return
        }

        // 插入数据库
        const [insertRows, insertFields]: [Insert_data, FieldPacket[]] = await mysql.execute('insert into userview (userid, username, visit_date, visit_time) values (?,?,?,?)',
            [userid, username, visit_date, visit_time]) as [Insert_data, FieldPacket[]];

        if(insertRows.affectedRows){
            ctx.status = 200
            ctx.body = {
                code: 0,
                msg: '上报成功',
                data: null
            } 
        }
    } catch (error) {
        console.log(error)
        throw error
    } finally {
        await next() 
    }
}


export const getUserView = async (ctx: Context, next: Next) => {
    try {

        const { start_date, end_date } = ctx.request.query
        
        const selectStart = start_date?.slice(0, 10)
        const selectEnd = end_date?.slice(0, 10)
        // 根据前端传递的日期区间进行查找
        const [rows, fields]: [UserVisit[], FieldPacket[]] = await mysql.execute('select * from userview where visit_date between ? and ?',
            [selectStart, selectEnd]) as [UserVisit[], FieldPacket[]];
     
        if (rows.length) {

            function groupUserVisitsByDate(userVisits: UserVisit[]): DailyUV[] {
                // 使用一个对象来存储每天的独立访客
                const dateMap: { [date: string]: Set<string> } = {};
            
                // 遍历数据，按日期分组
                for (const visit of userVisits) {
                    const { visit_date, userid } = visit;
            
                    // 如果日期不存在，初始化一个 Set
                    if (!dateMap[visit_date]) {
                        dateMap[visit_date] = new Set();
                    }
            
                    // 将 userid 添加到对应日期的 Set 中
                    dateMap[visit_date].add(userid);
                }
            
                // 将 dateMap 转换为 [{date: xxx, usernums: xxx}, ...] 的格式
                const result: DailyUV[] = [];
                for (const date in dateMap) {
                    result.push({
                        date,
                        usernums: dateMap[date].size, // Set 的 size 就是独立访客数
                    });
                }
            
                return result;
            }


            const result = groupUserVisitsByDate(rows)
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