import { z } from "zod";
import { USER_ROLES, USER_STATUSES } from "@/server/access/roles";

export const userRoleSchema = z.enum(USER_ROLES);
export const userStatusSchema = z.enum(USER_STATUSES);

/** Create a pending team member from the Invite User flow. */
export const userInviteSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).max(120).optional(),
  role: userRoleSchema,
});

/** Update an existing member's name, role, or status. */
export const userUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    role: userRoleSchema.optional(),
    status: userStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No changes provided",
  });

/**
 * Password policy for accepting an invite / setting a password. Enforced at the
 * DTO layer: min 10 chars with at least one letter and one number.
 */
export const adminPasswordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128)
  .refine((v) => /[a-zA-Z]/.test(v) && /[0-9]/.test(v), {
    message: "Password must include at least one letter and one number",
  });

/** Accept a team invite: single-use token + the chosen password. */
export const acceptInviteSchema = z.object({
  token: z.string().trim().min(32),
  password: adminPasswordSchema,
});

/**
 * Kick off a password reset. Only the email is required; the response is
 * always generic so it cannot be used to enumerate accounts.
 */
export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

/** Complete a reset: single-use token + the new password. */
export const resetPasswordSchema = z.object({
  token: z.string().trim().min(32),
  password: adminPasswordSchema,
});

export type UserInviteInput = z.infer<typeof userInviteSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
