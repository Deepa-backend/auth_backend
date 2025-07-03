import { z } from "zod";

// ✅ Define schemas first

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Name must be at least 3 characters")
      .max(50, "Name is too long")
      .regex(/^[\p{L}\p{M}.'\- ]+$/u, "Invalid characters in name")
      .refine((val) => !/\s{2,}/.test(val), {
        message: "Name cannot contain consecutive spaces",
      }),

    email: z.string().trim().email("Invalid email address"),
    mobile: 
  z.string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Invalid mobile number (must be 10 digits, start with 6-9)"),

    password: z
      .string()
      .trim()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must not exceed 100 characters")
      .refine((val) => /[A-Z]/.test(val), {
        message: "Password must include at least one uppercase letter",
      })
      .refine((val) => /[a-z]/.test(val), {
        message: "Password must include at least one lowercase letter",
      })
      .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), {
        message: "Password must include at least one special character",
      }),

    password_confirmation: z.string().trim(),

    roles: z.array(z.enum(["user", "admin"])).optional(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z
    .string()
    .trim()
    .min(8, "Password must be at least 8 characters"),
});

const verifyEmailSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  otp: z
    .number({
      required_error: "OTP is required",
      invalid_type_error: "OTP must be a number",
    })
    .int("OTP must be an integer")
    .min(1000, "OTP must be at least 4 digits")
    .max(999999, "OTP must be at most 6 digits"),
});

// ✅ Now export them at the end
export {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
};
