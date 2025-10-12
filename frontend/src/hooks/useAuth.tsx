import { createContext, useContext, useEffect, useState } from 'react'
import { auth, signInWithGoogle } from '../lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { postJSON, API_BASE } from '../lib/api'
const AuthCtx = createContext({} as any)
export function AuthProvider({ children }: { children: React.ReactNode }){
  const [user,setUser] = useState<any>(null); const [authReady,setAuthReady]=useState(false)
  useEffect(()=>{ const unsub = onAuthStateChanged(auth, async (u)=>{ if(!u){ setUser(null); setAuthReady(true); return } const email=u.email||''; if(!email.endsWith('@frame15.com')){ await signOut(auth); alert('Please sign in with your @frame15.com Google account.'); setUser(null); setAuthReady(true); return } try{ const idToken = await u.getIdToken(); await postJSON('/auth/sessionLogin',{ idToken }) }catch(e){ console.error('sessionLogin failed', e) } finally{ setUser(u); setAuthReady(true) } }); return ()=>unsub() },[])
  const login = async()=>{ await signInWithGoogle() }
  const logout = async()=>{ try{ await fetch(`${API_BASE}/auth/sessionLogout`,{ method:'POST', credentials:'include' }) }catch{} await signOut(auth); setUser(null) }
  return <AuthCtx.Provider value={{ user, authReady, login, logout }}>{children}</AuthCtx.Provider>
}
export const useAuth = ()=>useContext(AuthCtx)