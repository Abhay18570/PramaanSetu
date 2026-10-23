import { z } from 'zod'
import type { Application, User } from '../storage/models.ts'
import { applicationType } from './config.ts'
export const institutionDetailsSchema = z.object({
  institutionName: z.string().max(200),
  institutionType: z.string().max(100),
  contactPerson: z.string().max(100),
  email: z.string().max(150),
  phone: z.string().max(30),
  state: z.string().max(100),
  city: z.string().max(100),
  address: z.string().max(1000),
  pincode: z.string().max(12),
})
export const applicationDetailsSchema = z.object({
  approvalType: z.string().max(100),
  institutionCode: z.string().max(100),
  universityAffiliation: z.string().max(200),
  establishmentYear: z.string().max(4),
  existingApprovalReference: z.string().max(100),
  proposedIntake: z.number().finite().optional(),
  remarks: z.string().max(2000),
})
export type InstitutionDetails = z.infer<typeof institutionDetailsSchema>
export type ApplicationDetails = z.infer<typeof applicationDetailsSchema>
export interface ApplicationRecord extends Application {
  referenceNumber: string
  institutionUserId: string
  applicationType: string
  academicYear: string
  institutionDetails: InstitutionDetails
  applicationDetails: ApplicationDetails
  documentIds: string[]
  currentStep: number
  revision: number
  statusHistory: {
    status: Application['status']
    timestamp: string
    actorUserId?: string
  }[]
}
export function emptyInstitution(user?: User): InstitutionDetails {
  return {
    institutionName: user?.institutionName ?? '',
    institutionType: user?.institutionType ?? '',
    contactPerson: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    state: user?.state ?? '',
    city: user?.city ?? '',
    address: '',
    pincode: '',
  }
}
export function emptyDetails(): ApplicationDetails {
  return {
    approvalType: applicationType.id,
    institutionCode: '',
    universityAffiliation: '',
    establishmentYear: '',
    existingApprovalReference: '',
    remarks: '',
  }
}
// Additive hydration: v1 metadata remains readable without overwriting legacy data.
export function hydrateApplication(record: Application): ApplicationRecord {
  return {
    ...record,
    referenceNumber:
      record.referenceNumber ??
      `PS-LEGACY-${record.id.slice(0, 8).toUpperCase()}`,
    institutionUserId: record.userId,
    applicationType: record.applicationType ?? applicationType.id,
    academicYear: record.academicYear ?? '',
    institutionDetails: record.institutionDetails ?? {
      ...emptyInstitution(),
      institutionName: record.institutionName,
    },
    applicationDetails: record.applicationDetails ?? emptyDetails(),
    documentIds: record.documentIds ?? [],
    currentStep: record.currentStep ?? 1,
    revision: record.revision ?? 0,
    statusHistory: record.statusHistory ?? [],
  }
}
export const institutionValidation = institutionDetailsSchema.extend({
  institutionName: z.string().trim().min(2, 'Enter institution name.').max(200),
  institutionType: z.string().min(1, 'Select institution type.'),
  contactPerson: z.string().trim().min(2, 'Enter contact person.'),
  email: z.email('Enter a valid email.'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number.'),
  state: z.string().trim().min(2, 'Enter state.'),
  city: z.string().trim().min(2, 'Enter city.'),
  address: z.string().trim().min(5, 'Enter full address.').max(1000),
  pincode: z.string().regex(/^[1-9]\d{5}$/, 'Enter a valid PIN code.'),
})
export function validateApplication(
  record: ApplicationRecord,
  step?: number,
): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!step || step === 1) {
    const result = institutionValidation.safeParse(record.institutionDetails)
    if (!result.success)
      for (const issue of result.error.issues)
        errors[`institutionDetails.${String(issue.path[0])}`] = issue.message
  }
  if (!step || step === 2) {
    if (record.applicationType !== applicationType.id)
      errors.applicationType = 'Select application type.'
    const match = /^(\d{4})-(\d{4})$/.exec(record.academicYear)
    if (
      !match ||
      Number(match[2]) !== Number(match[1]) + 1 ||
      Number(match[1]) < 2000 ||
      Number(match[1]) > 2100
    )
      errors.academicYear = 'Enter an academic year such as 2026-2027.'
    const details = record.applicationDetails
    if (
      details.proposedIntake !== undefined &&
      (!Number.isInteger(details.proposedIntake) ||
        details.proposedIntake < 0 ||
        details.proposedIntake > 100000)
    )
      errors['applicationDetails.proposedIntake'] =
        'Enter a nonnegative whole number up to 100000.'
    if (
      details.establishmentYear &&
      (!/^\d{4}$/.test(details.establishmentYear) ||
        Number(details.establishmentYear) < 1800 ||
        Number(details.establishmentYear) > new Date().getFullYear())
    )
      errors['applicationDetails.establishmentYear'] =
        'Enter a valid establishment year.'
  }
  return errors
}
