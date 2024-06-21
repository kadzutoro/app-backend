const wrapperError = error => {
    const error = new Error();

    error.statusCode = error.statusCode || 500;
    error.status = error.status || 'error';
    error.message = error.message || 'Interval Server Error'

    return error
}

export default wrapperError;