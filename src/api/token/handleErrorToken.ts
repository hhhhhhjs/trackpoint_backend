import { Context, Next } from "koa";

export const handleErrorToken = async (ctx: Context, next: Next) => {
    try {
        await next();
    } catch (err:any) {
        if (err.name === 'UnauthorizedError') {
            if(err.message === 'jwt expired') {
                ctx.status = 401;
                ctx.body = {
                    code: 1002,
                    msg: 'token 过期, 请重新登录',
                    data: null
                }
            } else {
                ctx.status = 401;
                ctx.body = {
                    code: 1003,
                    msg: '无效的 token',
                    data: null
                };
            }
        } else {
            throw err;
        }
    }
}