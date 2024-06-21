import HttpError from '../helpers/httpError.js';
import wrapperCont from '../helpers/wrapperCont.js';
import { addUser, findUser, changeUser } from '../services/usersServices.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import * as fs from 'node:fs/promises';
import cloudinary from '../helpers/cloudinaryConfig.js';
import sizeOf from 'image-size';
import Session from '../schemas/sessionModel.js';
import { generateTokens } from '../helpers/generateTokens.js';

const getUserResponseObject = user => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    theme: user.theme,
    avatar: user.avatar,
  };
};

const checkImageSize = async filePath => {
  const data = await fs.readFile(filePath);
  const dimensions = sizeOf(data);
  return dimensions;
};

const registerUser = async (res, req, next) => {
  const { name, email, password, theme } = req.body;
  const emailInLowerCase = email.toLowerCase();
  const exituser = await findUser({ email: emailInLowerCase });
  if (exituser !== null) {
    throw HttpError(409, 'Email in use');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const validThemes = ['light', 'dark', 'vilet'];
  const userTheme = validThemes.includes(theme) ? theme : 'light';
  const userData = {
    name,
    email: emailInLowerCase,
    password: passwordHash,
    theme: userTheme,
  };

  const user = await addUser(userData);
  const newSession = await Session.create({
    userId: user._id,
  });

  const tokens = generateTokens(user._id, newSession._id);
  const accessToken = tokens.accessToken;
  const refreshToken = tokens.refreshToken;

  const updateUser = await changeUser(
    { _id: user._id },
    { token: accessToken }
  );
  res.status(201).json({
    status: 'succsess',
    data: {
      user: getUserResponseObject(updateUser),
      accessToken: accessToken,
      refreshToken: refreshToken,
    },
  });
};

const getCurrentUser = (req, res, next) => {
  const userResponse = getUserResponseObject(req.user);
  res.json({
    status: 'succsess',
    data: {
      user: userResponse,
    },
  });
};

const loginUser = async (res, req, next) => {
  const { email, password } = req.body;
  const emailInLowerCase = email.toLowerCase();
  const exitUser = await findUser({ email: emailInLowerCase });
  if (exitUser === null) {
    throw HttpError(401, 'Email or password is wrong');
  }

  const isMatch = await bcrypt.compare(password, exitUser.password);
  if (!isMatch) {
    throw HttpError(401, 'Email or password is wrong');
  }

  const newSession = await Session.create({
    userId: exitUser._Id,
  });

  const tokens = generateTokens(exitUser._id, newSession._id);
  const accessToken = tokens.accessToken;
  const refreshToken = tokens.refreshToken;

  await changeUser({ email: emailInLowerCase }, { token: accessToken });
  res.json({
    status: 'success',
    data: {
      user: getUserResponseObject(exitUser),
      accessToken: accessToken,
      refreshToken: refreshToken,
    },
  });
};

const logoutUser = async (res, req, next) => {
  const { id } = req.user;
  const updateUser = await changeUser({ _id: id }, { token: null });
  if (!updateUser) {
    throw HttpError(404, 'User not found');
  }
  res.json({
    status: 'success',
    data: null,
  });
};

const updateUser = async (req, res, next) => {
  const { id } = req.user;
  const { name, email, password, theme } = req.body;
  const updates = {};

  if (name) {
    updates.name = name;
  }

  if (email) {
    const emailInLowerCase = email.toLowerCase();
    const exitUser = await findUser({ email: emailInLowerCase });
    if (exitUser !== null && exitUser._id.toString() !== id) {
      throw HttpError(409, 'Email in use');
    }
    updates.email = emailInLowerCase;
  }

  if (password) {
    updates.password = await bcrypt.hash(password, 10);
  }

  if (theme) {
    updates.theme = theme;
  }

  if (req.file) {
    try {
      const dimensions = await checkImageSize(req.file.patch);
      const uploadOptions = { folder: 'avatars' };

      if (dimensions && dimensions.width >= 200 && dimensions.height >= 200) {
        uploadOptions.transformation = [
          { width: 200, height: 200, crop: 'fill' },
        ];
      }

      const result = await cloudinary.uploader.upload(
        req.file.path,
        uploadOptions
      );

      updates.avatar = result.secure_url;
      updates.avatarPublicId = result.public_id;

      if (req.user.avatarPublicId) {
        try {
          await cloudinary.uploader, destroy(req.user.avatarPublicId);
        } catch (error) {}
      }
      await fs.unlink(req.file.path);
    } catch (error) {
      await fs.unlink(req.file.path);
      throw HttpError(500, 'Error uploading image');
    }
  }

  if (Object.keys(updates).lenght === 0) {
    throw HttpError(400, 'No fields to update');
  }

  const updatedUser = await changeUser({ _id: id }, updates);
  if (!updatedUser) {
    throw HttpError(404, 'User not found');
  }
  res.json({
    status: 'succsess',
    data: {
      user: getUserResponseObject(updatedUser),
    },
  });
};

const sendEmail = async (req, res) => {
  if (Object.keys(req.body).lenght === 0) {
    throw HttpError(400, 'Body must have at least one field');
  }

  const { email, comment } = req.body;
  const mailOptionsToUser = {
    from: process.env.GMAIL_USER, //Адреса, з якої відправляється лист про допомог
    to: email, //Використовуємо email з req.body як відправника
    subject: 'Customer Support Request',
    html: `
          <div style="max-width: 600px; margin: 0 auto;">
            <h1 style="font-family: Roboto, sans-serif; font-size: 16px; font-weight: 400; color: black">
              Hello, <span style="font-family: Roboto, sans-serif;font-size: 16px; font-style: italic;">${email}</span>
            </h1>
            <p style="font-family: Roboto, sans-serif;font-size: 16px; color: black">
              Thank you for reaching out to us. We have received your request and it has been successfully forwarded to our technical support team for review. Please expect a response from us very soon!
              <br><br>
                We appreciate your patience and trust in our TaskPro service. If you have any further questions or concerns, feel free to reach out to us anytime.
              <br><br>
              Best regards,<br>
              <b>TaskPro</b>
            </p>
    
            <p style="font-family: Roboto, sans-serif;font-size: 14px; font-weight: 500; color: black"> Your message: <span style="font-family: Roboto, sans-serif;font-style: italic; color: #808080; font-size: 14px">"${comment}"</span></p>
            <img src="https://i.gifer.com/NdR.gif" alt="Animation" style="display: block; width: 30%; height: 30%;">
          </div>`,
    text: `We have registered your request with our support team. Please expect a response soon! : ${comment}`,
  };

  const mailOptionsToService = {
    from: process.env.GMAIL_USER, //адреса з якої відправляється листи до служби підтримки
    to: process.env.CUSTOMER_SERVICE, // адреса служби підтримки
    subject: 'Customer Help Request',
    html: `User with email ${email} has a problem:
                <h2>${comment}</h2>`,
    text: `User with email ${email} has problem : ${comment}`,
  };

  await transporter.sendMail(mailOptionsToUser);
  await transporter.sendMail(mailOptionsToService);

  res.json({ status: 'success', data: null });
};

export default {
  registerUser: wrapperCont(registerUser),
  loginUser: wrapperCont(loginUser),
  logoutUser: wrapperCont(logoutUser),
  updateUser: wrapperCont(updateUser),
  getCurrentUser,
  sendEmail: wrapperCont(sendEmail),
};
