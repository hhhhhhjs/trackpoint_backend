import { Context, Next } from "koa";

export const getAvatarFiles = async (ctx: Context, next: Next) => {
    console.log('请求了')
    ctx.status = 200
    ctx.body = {
        code: 0,
        msg: '获取头像成功',
        data:null
    }
}