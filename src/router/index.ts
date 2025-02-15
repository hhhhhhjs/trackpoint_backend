import Koarouter from 'koa-router';
import { register } from '../api/register';
import { login } from '../api/login';
import { handleUserDevice } from '../api/equipmessage';
import { geteUserDevice } from '../api/equipmessage';
import { trackEvent } from '../api/trackEvent';

const router = new Koarouter()

router.post('/api/register', register)
router.post('/api/login', login)
router.post('/api/userequipment', handleUserDevice)
router.get('/api/userequipment', geteUserDevice)
router.post('/api/trackEvent', trackEvent)

export default router