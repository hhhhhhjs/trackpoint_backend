import Koarouter from 'koa-router';
import { register } from '../api/register';
import { login } from '../api/login';

const router = new Koarouter()

router.post('/api/register', register)
router.post('/api/login', login)

export default router