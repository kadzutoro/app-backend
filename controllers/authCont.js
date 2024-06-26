import jwt, { decode } from 'jsonwebtoken';
import queryString from 'query-string';
import bcrypt from 'bcryptjs';
import express from 'express'

import getUserResponseObject from './userCont.js';
import wrapperCont from '../helpers/wrapperCont.js';
import HttpError from '../helpers/httpError.js';
import Session from '../schemas/sessionModel.js';
import { changeUser, findUser, addUser } from '../servises/userServ.js';
import { generateTokens } from '../helpers/generateToken.js';
import {
  createSession,
  deleteSession,
  findSession,
} from '../servises/sessionsServ.js';

const refreshTokens = async (req,res,next) => {
    // const { refreshToken } = req.body

    const notAuthError = HttpError(401, 'Not Authorized')

    const authorizationHeader = req.headers.authorization;
    if(!authorizationHeader) {
      throw notAuthError;
    }

    const [bearer, token] = authorizationHeader.split(' ');
    if(bearer !== 'Bearer' || !token) {
      throw notAuthError
    }
    let decoded;
    try {
      decoded = jwt.vetify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      throw notAuthError
    }

    const session = await findSession({_id: decoded.sessionId})
    if(!session) {
      throw notAuthError
    }

    const user = await findUser({ _id: session.userId })
    if(!user) {
      throw notAuthError
    }

    await deleteSession({ _id: decoded.sessionId })

    const newSession = await createSession({ userId: user._id});

    const { accessToken, refreshToken } = generateTokens(
      user._id,
      newSession._id
    );

    await changeUser({ _id: newSession.userId }, { token: accessToken })

    res.json({
      status: 'succsess',
      data: {
        accessToken,
        refreshToken,
      }
    })
}

const googleAuth = async (req, res, next) => {
  const stringifiedParams = queryString.stringify({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.BACKEND_URL}/api/auth/google-redirect`,
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' '),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
  });
  return res.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${stringifiedParams}`
  );
};


const googleRedirect = async (req,res,next) => {
  const fullURl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const urlObj = new URL(fullUrl);
  const urlParams = queryString.parse(urlObj.search);
  const code = urlParams.code;

  const tokenDataResponse = await fetch(`https://oauth2.googleapis.com/token`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cliend_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_url: `${process.env.BACKEND_URL}/api/auth/google-redirect`,
      grant_type: 'authorization_code',
      code, 
    })
  })

  if ( tokenDataResponse.status !== 200) {
    throw HttpError(500, 'Internal Server Error')
  }
  const tokenData = await tokenDataResponse.json();

  const userDataResponse = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo', {
      mehtod: 'get',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      }
    }
  )

  if( userDataResponse.status !== 200 ) {
    throw HttpError(500, 'Internal Server Error')
  }

  const userData = await userDataResponse.json();

  let user = await findUser({ email: userData.email });
  if(!user) {
    const passwordHash = await bcrypt.hash(userData.id, 10);
    user = await addUser ({
      name: userData.name ? userData.name : userData.email.split('@')[0],
      email: userData.email,
      password: passwordHash,
      avatar: userData.picture ? userData.picture : null,
    })
  }

  const session = await Session.create({
    userId: user._id,
  })

  const { accessToken, refreshToken } = generateTokens(user._id, session._id);
  
  await changeUser({ _id: user._id }, { token: accessToken });

  const stringifiedParams = queryString.stringify({
    ...getUserResponseObject(user),
    accessToken: [...accessToken].join(' '),
    refreshToken: [...refreshToken].join(' '),
  });

  return res.redirect(`${process.env.FRONTEND_URL}?${stringifiedParams}`)
};

export default {
  googleAuth: wrapperCont(googleAuth),
  googleRedirect: wrapperCont(googleRedirect),
  refreshTokens: wrapperCont(refreshTokens),
};




