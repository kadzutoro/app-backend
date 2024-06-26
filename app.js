import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import HttpError from './helpers/httpError.js';
import taskRouter from './routes/taskRouter.js';
import userRouter from './routes/userRouter.js';
import authRouter from './routes/authRouter.js';
import authMiddleware from './middlewares/auth.js';

const swaggerDocument = Json.parse(fs.readFileSync('./swagger.json', 'utf-8'));

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api', authMiddleware, taskRouter);

app.use((req, res, next) => {
  next(HttpError(404, 'Route not found'));
});

app.use((err, req, res, next) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

export default app;