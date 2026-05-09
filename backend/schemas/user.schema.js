const { z } = require('zod');
const createUserSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    firstName: z.string({ message: "First name is required" }).min(1),
    lastName: z.string({ message: "last name is required" }).min(1),

    password: z.string().min(8, { message: "Password must be greater or equal to 8 chars" }).max(32, { message: "Password must be less or equal than 32 chars" }),
    confirmPassword: z.string().min(8, { message: "Password must be greater or equal to 8 chars" }).max(32, { message: "Password must be less or equal than 32 chars" }),


    role: z.enum(['HR', 'candidat']).optional(),
    dob: z.string().optional(),
    avatar: z.string().optional().nullable(),

}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});


const updateUserSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    firstName: z.string({ message: "First name is required" }).min(1),
    lastName: z.string({ message: "last name is required" }).min(1),

    role: z.enum(['HR', 'candidat']).optional(),
    dob: z.string().optional(),
    avatar: z.string().optional().nullable(),

});
module.exports = { createUserSchema, updateUserSchema };