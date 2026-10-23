import { z } from 'zod'
import { normalizedEmail, roles } from '../storage/models.ts'
import type { Role, User } from '../storage/models.ts'
export type { Role, User } from '../storage/models.ts'
export const accountFieldsSchema = z.object({
  name: z.string().trim().min(2, 'Enter a name.').max(100), email: normalizedEmail,
  institutionName: z.string().trim().max(100), phone: z.string().trim(), state: z.string().trim().max(100), city: z.string().trim().max(100), department: z.string().trim().max(100),
})
export type AccountFields = z.infer<typeof accountFieldsSchema>
export const registrationSchema = accountFieldsSchema.extend({ role: z.enum(roles) }).superRefine((data, ctx) => {
  if (data.role === 'INSTITUTION') {
    for (const key of ['institutionName', 'state', 'city'] as const) if (data[key].length < 2) ctx.addIssue({ code: 'custom', path: [key], message: 'This field is required.' })
    if (!/^[6-9]\d{9}$/.test(data.phone)) ctx.addIssue({ code: 'custom', path: ['phone'], message: 'Enter a 10-digit phone number starting with 6–9.' })
  } else if (data.department.length < 2) ctx.addIssue({ code: 'custom', path: ['department'], message: 'Enter a department or designation.' })
})
export type Registration = z.infer<typeof registrationSchema>
export const loginSchema = z.object({ email: normalizedEmail })
export function profileFormSchema(role: Role) { return accountFieldsSchema.superRefine((data, ctx) => {
  const result = registrationSchema.safeParse({ ...data, role })
  if (!result.success) result.error.issues.forEach(issue => ctx.addIssue({ code: 'custom', path: issue.path, message: issue.message }))
}) }
export function accountFields(user?: User | null): AccountFields { return { name: user?.name ?? '', email: user?.email ?? '', institutionName: user?.institutionName ?? '', phone: user?.phone ?? '', state: user?.state ?? '', city: user?.city ?? '', department: user?.department ?? '' } }
export function rolePath(role: Role) { return role === 'INSTITUTION' ? '/institution' : '/officer' }
export function dashboardPath(role: Role) { return `${rolePath(role)}/dashboard` }
export function parseRole(value: unknown): Role { return value === 'OFFICER' ? 'OFFICER' : 'INSTITUTION' }
export function routeAccess(user: User | null, required: Role): string | null {
  if (!user) return `/login?role=${required}`
  return user.role === required ? null : dashboardPath(user.role)
}
