import Koa from 'koa';
import { koaBody } from 'koa-body';
import cors from '@koa/cors';
import router from './router/index';

const app = new Koa();



app.use(cors({
    origin: 'http://localhost:5173',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}))
app.use(koaBody())
app.use(router.routes()).use(router.allowedMethods());


app.listen(3000,'127.0.0.1', () => {
    console.log('server is listening on port 3000')
})