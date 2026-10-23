import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import type { Registration, Role } from '../auth/model'
import { FormField } from './Forms'

export default function AccountFields({
  role,
  register,
  errors,
}: {
  role: Role
  register: UseFormRegister<Registration>
  errors: FieldErrors<Registration>
}) {
  const field = (key: keyof Registration) => ({
    ...register(key),
    'aria-invalid': !!errors[key],
    'aria-describedby': errors[key] ? `${key}-error` : undefined,
    className: `gov-input ${errors[key] ? 'gov-input-error' : ''}`,
  })

  return (
    <div className="gov-form-grid">
      {role === 'INSTITUTION' && (
        <div className="gov-form-col-full">
          <FormField id="institutionName" label="Institution Name" error={errors.institutionName?.message}>
            <input
              id="institutionName"
              placeholder="e.g. Government Engineering College / Apex Institute"
              {...field('institutionName')}
            />
          </FormField>
        </div>
      )}

      <FormField
        id="name"
        label={role === 'INSTITUTION' ? 'Authorized Coordinator Name' : 'Officer Full Name'}
        error={errors.name?.message}
      >
        <input
          id="name"
          autoComplete="name"
          placeholder={role === 'INSTITUTION' ? 'e.g. Dr. Ramesh Sharma' : 'e.g. Rajesh K. Varma'}
          {...field('name')}
        />
      </FormField>

      <FormField id="email" label="Official / Registered Email" error={errors.email?.message}>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="e.g. coordinator@college.edu.in"
          {...field('email')}
        />
      </FormField>

      {role === 'INSTITUTION' ? (
        <>
          <FormField id="phone" label="Contact Mobile Number (10 Digits)" error={errors.phone?.message}>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="e.g. 9876543210"
              {...field('phone')}
            />
          </FormField>

          <FormField id="state" label="State / Union Territory" error={errors.state?.message}>
            <input
              id="state"
              placeholder="e.g. Maharashtra"
              {...field('state')}
            />
          </FormField>

          <FormField id="city" label="City / District" error={errors.city?.message}>
            <input
              id="city"
              placeholder="e.g. Pune"
              {...field('city')}
            />
          </FormField>
        </>
      ) : (
        <div className="gov-form-col-full">
          <FormField id="department" label="Department / Scrutiny Panel" error={errors.department?.message}>
            <input
              id="department"
              placeholder="e.g. Technical Education Scrutiny Committee / Bureau 04"
              {...field('department')}
            />
          </FormField>
        </div>
      )}
    </div>
  )
}
