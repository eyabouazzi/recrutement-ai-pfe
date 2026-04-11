const { z } = require('zod');
const signUpSchema = z.object({
    email: z.string().trim().toLowerCase().email({ message: "Invalid email address" }),
    firstName: z.string({ message: "First name is required" }).trim().min(1, "First name is required"),
    lastName: z.string({ message: "Last name is required" }).trim().min(1, "Last name is required"),
    role: z.enum(['HR', 'candidat'], { message: "Role must be either HR or candidat" }).optional().default('candidat'),
    dob: z.string().optional().refine(val => !val || /^\d{4}-\d{2}-\d{2}/.test(val), "Date must be in YYYY-MM-DD format"),
    password: z.string().min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" }).max(32, { message: "Mot de passe trop long (max 32)" }),
    confirmPassword: z.string().min(8, { message: "Confirmation requise (8 caractères min.)" }).max(32, { message: "Mot de passe trop long (max 32)" }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" }).max(32, { message: "Mot de passe trop long (max 32)" }),
});

const changePasswordSchema = z.object({
    oldPassword: z.string().min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" }).max(32, { message: "Mot de passe trop long (max 32)" }),
    newPassword: z.string().min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" }).max(32, { message: "Mot de passe trop long (max 32)" }),
    confirmPassword: z.string().min(8, { message: "Confirmation requise (8 caractères min.)" }).max(32, { message: "Mot de passe trop long (max 32)" }),
});
module.exports = { signUpSchema, loginSchema, changePasswordSchema };
