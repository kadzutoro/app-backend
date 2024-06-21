import express from 'express';
import authCont from '../controllers/authCont.js'

const authRouter = express.Router();

authRouter.get('/refresh-tokens', authCont.refreshTokens);

authRouter.get('/google', authCont.googleAuth);

authRouter.get('/goole-redirect', authCont.googleRedirect);

export default authRouter;