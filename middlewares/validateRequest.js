import sendResponse from '../utils/sendResponse.js';
 //console.log("req.body:", req.body);
export const validateRequest = (schema) => async (req, res, next) => {
    try {
     
        const parsedBody = await schema.parseAsync(req.body);
        req.body = parsedBody;
        next();
    } catch (err) {
        console.log( err)
        const message = err.errors?.[0]?.message || "Invalid input data";
        return sendResponse(res, message, 400, false);
    }
};


