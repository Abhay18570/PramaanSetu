export const applicationType = {
  id: 'EXTENSION_OF_APPROVAL',
  name: 'Extension of Approval — Institutional Application',
} as const
export const maxFileSize = 10 * 1024 * 1024
export const documentCategories = [
  { id: 'APPROVAL_LETTER', label: 'Existing Approval Letter', required: true },
  {
    id: 'REGISTRATION',
    label: 'Institution Registration Certificate',
    required: true,
  },
  {
    id: 'AFFILIATION',
    label: 'Affiliating University Document',
    required: true,
  },
  {
    id: 'LAND_BUILDING',
    label: 'Land / Building Supporting Document',
    required: true,
  },
  { id: 'FIRE_SAFETY', label: 'Fire Safety Document', required: true },
  { id: 'FACULTY', label: 'Faculty Details', required: false },
  { id: 'INFRASTRUCTURE', label: 'Infrastructure Details', required: false },
  {
    id: 'ADDITIONAL',
    label: 'Additional Supporting Document',
    required: false,
  },
] as const
export const institutionTypes = [
  'Engineering College',
  'Polytechnic',
  'University',
  'Management Institute',
  'Other',
]
