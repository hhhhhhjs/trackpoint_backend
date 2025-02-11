import Koarouter from 'koa-router';
import { register } from '../api/register';
import { login } from '../api/login';
import { handleUserDevice } from '../api/equipmessage';

const router = new Koarouter()

router.post('/api/register', register)
router.post('/api/login', login)
router.post('/api/userequipment', handleUserDevice)

export default router