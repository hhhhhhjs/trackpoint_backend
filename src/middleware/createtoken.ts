import jwt from 'jsonwebtoken'
import { IToken } from '../types/token';

const secret = '@jwt#token/-/secret.'
const createToken = (payload: IToken) => {
    const token = jwt.sign(payload, secret, { expiresIn: '5h' })
    return token
}

export {
    createToken,
    secret
}