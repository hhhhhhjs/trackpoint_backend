import Koarouter from 'koa-router';
import { register } from '../api/register';

const router = new Koarouter()

router.post('/api/register', register)

export default router