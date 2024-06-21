import { Schema, model } from 'mongoose'

const emailRegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const userSchema = new Schema( {
    name: {
        type: String,
        required: [true, 'Name is required'],
        minLenght: [2, 'Name must be at least 2 characters long'],
        maxLenght: [32, 'Name must be at most 32 characters long'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        match: [emailRegExp, 'Please enter a valid email address'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minLenght: [8, 'Password must be at least 8 characters long'],
        maxLenght: [64, 'Password must be at most 64 characters long'],
    },
    token: {
        type: String,
        default: null
    },
    avatar: {
        type: String,
        default: null,
    },
    theme: {
        type: String,
        enum: ['light', 'dark', 'violet'],
        default: 'light'
    }
}, {versionKey: false}
)

export default model('User', userSchema);

