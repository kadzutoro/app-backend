import wrapperError from "./wrapperError.js";

const wrapperCont = cont => {
    const func = async(req,res,next) => {
        try {
            await cont(req,res,next);
        } catch (error) {
            next(wrapperError(error))
        };
        return func;
    };
};


export default wrapperCont;
