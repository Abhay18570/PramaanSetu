import { createContext } from 'react'
import type { AccountFields, Registration, User } from './model'
export interface AuthValue {
  user: User | null; storageNotice: string
  signIn: (userId: string) => Promise<User>
  register: (data: Registration) => Promise<User>
  updateProfile: (data: AccountFields) => Promise<void>
  signOut: () => Promise<void>
  deleteAccount: () => Promise<void>
  clearData: () => Promise<void>
}
export const AuthContext = createContext<AuthValue | null>(null)
