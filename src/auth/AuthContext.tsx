import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './context'
import type { AuthValue } from './context'
import { localAccountService } from './service'
import { sessionRepository } from '../storage/sessionRepository'
import { subscribeStorage } from '../storage/localStorage'
import { startDemo as createDemoSession } from '../demo/service'
function restore() { try { return { user: sessionRepository.restore(), storageNotice: '' } } catch (error) { return { user: null, storageNotice: error instanceof Error ? error.message : 'Local data could not be read.' } } }
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(restore)
  useEffect(() => subscribeStorage(() => setState(restore())), [])
  const value: AuthValue = {
    ...state,
    async signIn(id) { const user = await localAccountService.signIn(id); setState({ user, storageNotice: '' }); return user },
    async register(data) { const user = await localAccountService.register(data); setState({ user, storageNotice: '' }); return user },
    async updateProfile(data) { if (!state.user) throw new Error('Choose a local account first.'); const user = await localAccountService.updateProfile(state.user.id, data); setState({ user, storageNotice: '' }) },
    async signOut() { await localAccountService.signOut(); setState({ user: null, storageNotice: '' }) },
    async deleteAccount() { if (!state.user) throw new Error('Choose a local account first.'); await localAccountService.deleteAccount(state.user.id); setState({ user: null, storageNotice: '' }) },
    async clearData() { await localAccountService.clearData(); setState({ user: null, storageNotice: '' }) },
    async startDemo(role) { const user=createDemoSession(role); setState({user,storageNotice:''}); return user },
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
