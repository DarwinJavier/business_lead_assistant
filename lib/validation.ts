import { z } from "zod";

export const contactPreferenceSchema = z.enum(["email", "phone", "either"]);
export const photosSchema = z.enum(["yes", "no", "not_sure"]);

export const leadSubmissionSchema = z
  .object({
    clientSlug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
    projectType: z.string().trim().min(2).max(120),
    projectDescription: z.string().trim().min(20).max(4000),
    projectGoals: z.string().trim().max(1500).optional().or(z.literal("")),
    projectLocation: z.string().trim().max(250).optional().or(z.literal("")),
    projectPostalCode: z.string().trim().min(3).max(20),
    timeline: z.string().trim().min(2).max(120),
    budgetRange: z.string().trim().min(2).max(120),
    hasPhotos: photosSchema,
    contactPreference: contactPreferenceSchema,
    homeownerName: z.string().trim().min(2).max(120),
    homeownerEmail: z
      .string()
      .trim()
      .max(254)
      .refine((value) => value === "" || z.string().email().safeParse(value).success, {
        message: "Enter a valid email address, such as name@example.com.",
      })
      .optional()
      .or(z.literal("")),
    homeownerPhone: z.string().trim().min(7).max(40).optional().or(z.literal("")),
    company: z.string().trim().max(0).optional().or(z.literal("")),
  })
  .strict()
  .superRefine((value, context) => {
    const hasEmail = Boolean(value.homeownerEmail);
    const hasPhone = Boolean(value.homeownerPhone);

    if (!hasEmail && !hasPhone) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["homeownerEmail"],
        message: "Provide an email or phone number.",
      });
    }

    if (value.contactPreference === "email" && !hasEmail) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["homeownerEmail"],
        message: "Email is required when email is the preferred contact method.",
      });
    }

    if (value.contactPreference === "phone" && !hasPhone) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["homeownerPhone"],
        message: "Phone is required when phone is the preferred contact method.",
      });
    }
  });

export type LeadSubmissionSchema = z.infer<typeof leadSubmissionSchema>;

export function parseLeadSubmission(input: unknown) {
  return leadSubmissionSchema.safeParse(input);
}
