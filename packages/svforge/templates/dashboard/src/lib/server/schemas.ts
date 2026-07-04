import { z } from 'zod';

export const loginSchema = z.object({
email: z.string().email(),
password: z.string().min(8)
});

export const changePasswordSchema = z.object({
currentPassword: z.string().min(8),
newPassword: z.string().min(8)
});

export const createUserSchema = z.object({
name: z.string().min(1),
email: z.string().email(),
password: z.string().min(8)
});

export const updateUserSchema = z.object({
id: z.string().min(1),
name: z.string().min(1),
email: z.string().email()
});

export const deleteUserSchema = z.object({
id: z.string().min(1)
});

export const toggleVerifySchema = z.object({
id: z.string().min(1),
verified: z.boolean()
});

export const setupSchema = z.object({
name: z.string().min(1),
email: z.string().email(),
password: z.string().min(8)
});

export type LoginSchema = typeof loginSchema;
export type ChangePasswordSchema = typeof changePasswordSchema;
export type CreateUserSchema = typeof createUserSchema;
export type UpdateUserSchema = typeof updateUserSchema;
export type DeleteUserSchema = z.infer<typeof deleteUserSchema>;
export type ToggleVerifySchema = typeof toggleVerifySchema;
export type SetupSchema = typeof setupSchema;
