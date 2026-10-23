import { useSyncExternalStore } from 'react'
import { useAuth } from '../auth/useAuth'
import { getStorageRevision, subscribeStorage } from '../storage/localStorage'
import { applicationRepository } from '../storage/applicationRepository'
import { activityRepository } from '../storage/activityRepository'
export function useLocalData() {
  useSyncExternalStore(subscribeStorage, getStorageRevision, () => 0)
  const { user } = useAuth()
  try { return { applications: user ? applicationRepository.forUser(user) : [], activity: user ? (user.role === 'OFFICER' ? activityRepository.list().filter(event => event.userId === user.id || event.actorUserId === user.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt)) : activityRepository.forUser(user.id)).slice(0,5) : [], error: '' } }
  catch (error) { return { applications: [], activity: [], error: error instanceof Error ? error.message : 'Local data could not be read.' } }
}
