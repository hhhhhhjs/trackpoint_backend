import Koarouter from 'koa-router';
import { koaBody } from 'koa-body';
import serve from 'koa-static';
import { __dirname } from '../api/filepath/getFilePath'
import { register } from '../api/register';
import { login } from '../api/login';
import { handleUserDevice } from '../api/equipmessage';
import { geteUserDevice } from '../api/equipmessage';
import { trackEvent } from '../api/trackEvent';
import { trackError } from '../api/trackError';
import { getEvent } from '../api/trackEvent';
import { getError } from '../api/trackError';
import { uploadAvatar } from '../api/avatar'
import { getAvatar } from '../api/avatar'

const router = new Koarouter()
router.post('/api/register', register)
router.post('/api/login', login)
router.post('/api/userequipment', handleUserDevice)
router.get('/api/userequipment', geteUserDevice)
router.post('/api/trackEvent', trackEvent)
router.get('/api/getEvent', getEvent)
router.post('/api/trackError', trackError)
router.get('/api/getError', getError)
router.post('/api/uploadAvatar', koaBody({
    multipart: true, // 启用 multipart
    formidable: {
        uploadDir: __dirname, // 文件上传目录
        keepExtensions: true, // 保留文件扩展名
        maxFileSize: 10 * 1024 * 1024, // 限制文件大小（10MB）
        onFileBegin: (name, file) => {
            const newfileName = `${new Date().getTime()}_${file.newFilename}`
            file.filepath = file.filepath.replace(file.newFilename, newfileName);
            (file as { selfname?: string }).selfname = newfileName
        }
    },
}), uploadAvatar)

router.get('/api/getAvatar', getAvatar)

export default router