import express from 'express';
import {
    createBoardSchema,
    updateBoardSchema,
    createColumnSchema,
    updateColumnSchema,
    createTaskSchema,
    updateTaskSchema
} from '../schemas/taskSch.js';
import validateBody from '../helpers/validateBody.js';
import validateId from '../middlewares/validateId.js';
import taskCont from '../controllers/taskCont.js';

const taskRouter = express.Router();

// ------ Road to Board

taskRouter.get('/boards', taskCont.getAllBoards);
taskRouter.post('/boards', validateBody(createBoardSchema), taskCont.createBoard);
taskRouter.get('/boards/:id', validateId, taskRouter.getOneBoard); 
taskRouter.patch('/boards/:id', validateId,validateBody(updateBoardSchema), taskCont.editBoard);
taskRouter.delete('/boards/:id', validateId, taskCont.deleteBoard);

// ------ ROAD TO COLUMN

taskRouter.post('/columns', validateBody(createColumnSchema), taskCont.createColumn);
taskRouter.patch('/columns/:id', validateId, validateBody(updateColumnSchema), taskCont.editColumn);
taskRouter.delete('/columns/:id', validateId, taskCont.deleteColumn);

// ------ ROAD TO TASK 

taskRouter.post('/tasks', validateBody(createTaskSchema),taskCont.createTask);
taskRouter.patch('/tasks/:id', validateId, validateBody(updateTaskSchema), taskCont.editTask);
taskRouter.delete('/tasks/:id', validateId, taskCont.deleteTask);


export default taskRouter;