/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { loginRequest, meRequest, registerRequest } from '../api/auth'
import { setUnauthorizedHandler, tokenStorage } from '../api/client'
import type { User } from '../types'
import { isCanceled } from '../utils/error'
import { useToast } from './ToastContext'

interface AuthContextValue {
  user: User | null
  loading: boolean 
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { notify } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(() => tokenStorage.get() !== null)

  useEffect(() => {
    if (!tokenStorage.get()) return
    const controller = new AbortController()
    meRequest(controller.signal)
      .then(setUser)
      .catch((error: unknown) => {
        if (!isCanceled(error)) setUser(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      tokenStorage.clear()
      setUser(null)
      notify('error', 'Sesi Anda berakhir atau token tidak valid. Silakan login kembali.')
    })
    return () => setUnauthorizedHandler(null)
  }, [notify])

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password)
    tokenStorage.set(result.token)
    setUser(result.user)
    return result.user
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    await registerRequest(name, email, password)
  }, [])

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}