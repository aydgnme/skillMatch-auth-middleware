import { z } from "zod";

// create zod schema for user
const UserSchema = z.object({
    userId: z.string(),
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(8),
    accountType: z.string().optional().nullish(),
    organizationName: z.string().nullish(),
    headquartersAddress: z.string().nullish(),
    registrationMethod: z.string(),
});

const updateUserSchema = z.object({
    name: z.string().optional().nullish()
});

// zod password schema that has min 6 characters has one uppercase, one number
const PasswordSchema = z
    .string()
    .min(8, "Password must include at least 8 characters")
    .regex(/[A-Z]/, "Password must include at least one Uppercase character")
    .regex(/[0-9]/, "Password must include at least one number")
    .regex(/[!@#$%^&*]/, "Password must include at least one special character");

// convert zod updateUserSchema to typescript updateUser type
type UpdateUserType = z.infer<typeof updateUserSchema>;

// convert zod user schema to typescript user type
type UserType = z.infer<typeof UserSchema>;

export {
    UserType,
    UserSchema,
    UpdateUserType,
    updateUserSchema,
    PasswordSchema,
};
