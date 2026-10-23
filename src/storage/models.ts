import { z } from 'zod'
import {
  institutionDetailsSchema,
  applicationDetailsSchema,
} from '../applications/model.ts'
import type {
  InstitutionDetails,
  ApplicationDetails,
} from '../applications/model.ts'
export type Role = 'INSTITUTION' | 'OFFICER'
export const roles = ['INSTITUTION', 'OFFICER'] as const
export const applicationStatuses = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'ACTION_REQUIRED',
  'REVIEWED',
] as const
export type ApplicationStatus = (typeof applicationStatuses)[number]
export interface User {
  id: string
  name: string
  email: string
  role: Role
  institutionName?: string
  institutionType?: string
  phone?: string
  state?: string
  city?: string
  department?: string
  createdAt: string
  updatedAt: string
}
export interface LocalSession {
  userId: string
  createdAt: string
  sessionVersion: 1
}
export interface Application {
  id: string
  userId: string
  institutionName: string
  type: string
  status: ApplicationStatus
  createdAt: string
  updatedAt: string
  referenceNumber?: string
  institutionUserId?: string
  applicationType?: string
  academicYear?: string
  institutionDetails?: InstitutionDetails
  applicationDetails?: ApplicationDetails
  documentIds?: string[]
  submittedAt?: string
  currentStep?: number
  revision?: number
  statusHistory?: {
    status: ApplicationStatus
    timestamp: string
    actorUserId?: string
  }[]
}
export interface Activity {
  id: string
  userId: string
  kind: 'ACCOUNT_CREATED' | 'PROFILE_UPDATED' | 'APPLICATION_UPDATED'
  message: string
  applicationId?: string
  createdAt: string
  actorUserId?: string
  action?: string
}
export const normalizedEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(150)
  .pipe(z.email('Enter a valid email address.'))
const text = z.string().trim().min(2, 'Enter at least 2 characters.').max(100)
export const userSchema: z.ZodType<User> = z
  .object({
    id: z.uuid(),
    name: text,
    email: normalizedEmail,
    role: z.enum(roles),
    institutionName: text.optional(),
    institutionType: text.optional(),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/)
      .optional(),
    state: text.optional(),
    city: text.optional(),
    department: text.optional(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .superRefine((user, context) => {
    const required =
      user.role === 'INSTITUTION'
        ? (['institutionName', 'phone', 'state', 'city'] as const)
        : (['department'] as const)
    required.forEach((key) => {
      if (!user[key])
        context.addIssue({
          code: 'custom',
          path: [key],
          message: 'This field is required.',
        })
    })
  })
export const sessionSchema: z.ZodType<LocalSession> = z.object({
  userId: z.uuid(),
  createdAt: z.iso.datetime(),
  sessionVersion: z.literal(1),
})
export const applicationSchema: z.ZodType<Application> = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  institutionName: z.string().max(200),
  type: text,
  status: z.enum(applicationStatuses),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  referenceNumber: z.string().optional(),
  institutionUserId: z.uuid().optional(),
  applicationType: z.string().optional(),
  academicYear: z.string().optional(),
  institutionDetails: institutionDetailsSchema.optional(),
  applicationDetails: applicationDetailsSchema.optional(),
  documentIds: z.array(z.uuid()).optional(),
  submittedAt: z.iso.datetime().optional(),
  currentStep: z.number().int().min(1).max(4).optional(),
  revision: z.number().int().nonnegative().optional(),
  statusHistory: z
    .array(
      z.object({
        status: z.enum(applicationStatuses),
        timestamp: z.iso.datetime(),
        actorUserId: z.uuid().optional(),
      }),
    )
    .optional(),
})
export const activitySchema: z.ZodType<Activity> = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  kind: z.enum(['ACCOUNT_CREATED', 'PROFILE_UPDATED', 'APPLICATION_UPDATED']),
  message: z.string().min(1).max(200),
  applicationId: z.uuid().optional(),
  createdAt: z.iso.datetime(),
  actorUserId: z.uuid().optional(),
  action: z.string().optional(),
})
