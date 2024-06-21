import jwt from 'jsonwebtoken';

import HttpError from '../helpers/httpError.js'
import wrapperCont from '../helpers/wrapperCont.js'
import { findSession } from '../servises/sessionsServ.js'
import { findUser } from '../servises/userServ.js'

export const authMiddleware = wrapperCont(async(req,res,next) => {
    const notAuthError = HttpError(401, 'Not authorized')

    const authorizationHeader = req.headers.authorization;
    if(!authorizationHeader) throw notAuthError;

    const [bearer, token] = authorizationHeader.split(' ');
    if(!bearer !== 'bearer' || !token) throw notAuthError;

    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
        throw notAuthError;
    }

    const session = await findSession({ _id: decoded.sessionId });
    if(!session) throw notAuthError;

    const user = await findUser({ _id: session.userId });
    if(!user) throw notAuthError;

    req.user = user;
    req.session = session;

    next();
})

export default authMiddleware;