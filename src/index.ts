import Koa from 'koa';
import { koaBody } from 'koa-body';
import cors from '@koa/cors';
import router from './router/index';
import koajwt from 'koa-jwt';
import { secret } from './middleware/createtoken';
import serve from 'koa-static';
import { __dirname } from './api/filepath/getFilePath';
import { handleErrorToken } from './api/token/handleErrorToken'
import conditional from 'koa-conditional-get'; 
import etag from 'koa-etag'; 

const app = new Koa();

app.use(cors({
    origin: 'http://localhost:5173',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}))

// 支持条件请求
app.use(conditional())

// 支持 etag
app.use(etag())


// 静态资源不需要校验 token
app.use(serve(__dirname))

// jwt 校验，并且排除 登录 和 注册接口

app.use(koajwt({ secret: secret }).unless({
    path: [/^\/api\/login/, /^\/api\/register/, /^\/api\/userequipment/, /^\/api\/getAvatar/, /^\/api\/trackError/]
}))

app.use(handleErrorToken)

app.use(koaBody())
app.use(router.routes()).use(router.allowedMethods());


app.listen(3000, '127.0.0.1', () => {
    console.log('server is listening on port 3000')
})