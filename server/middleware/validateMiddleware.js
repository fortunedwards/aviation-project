const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
    try {
        // Zod validation
        schema.parse(req.body);
        next();
    } catch (err) {
        // check if it's a Zod error
        if (err instanceof z.ZodError && Array.isArray(err.errors)) {
            const errorMessages = err.errors.map((e) => ({
                path: e.path[0],
                message: e.message
            }));
            
            return res.status(400).json({ 
                success: false, 
                errors: errorMessages 
            });
        }

        // Generic fallback to prevent "undefined map" errors
        console.error("Validation Middleware Error:", err);
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error during validation" 
        });
    }
};

module.exports = validate;