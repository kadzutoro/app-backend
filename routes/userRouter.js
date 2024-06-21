import express from 'express'
import userCont from '../controllers/userCont.js'
import {
    createUserSchema,
    loginUserSchema,
    mailOptionsToUserSchema,
    updateUserSchema,
  } from '../schemas/usersSch.js';
  import validateBody from '../helpers/validateBody.js';
  import auth from '../middlewares/auth.js';
  import { contentTypeHandler } from '../middlewares/contentTypeHandler.js';

const userRouter = express.Router();

userRouter.get('/current', auth, userCont.getCurrentUser);
userRouter.post('/register', validateBody(createUserSchema), userCont.registerUser);
userRouter.post('/login', validateBody(loginUserSchema), userCont.loginUser);
userRouter.post('/logout', auth, userCont.logoutUser);
userRouter.patch('/update', auth, contentTypeHandler, validateBody(updateUserSchema, userCont.updateUser));
userRouter.post('/need-help', auth, validateBody(mailOptionsToUserSchema), userCont.sendEmail);

export default userRouter;