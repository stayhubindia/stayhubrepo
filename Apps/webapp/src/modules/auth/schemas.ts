import { z } from "zod";

export const requestEmailOtpSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const verifyEmailOtpSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  otp: z
    .string()
    .regex(/^\d{4,8}$/, "OTP should be 4 to 8 digits"),
  role: z.enum(["TENANT", "OWNER"]).optional(),
  remember_me: z.boolean().optional(),
});

export type RequestEmailOtpInput = z.infer<typeof requestEmailOtpSchema>;
export type VerifyEmailOtpInput = z.infer<typeof verifyEmailOtpSchema>;
