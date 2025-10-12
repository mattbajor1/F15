import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth, AuthProvider } from './hooks/useAuth'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import './styles.css'
function Guarded(){ const { user, authReady, login } = useAuth(); if(!authReady) return <div className='p-6'>Loading…</div>; if(!user) return (<div className='min-h-screen flex items-center justify-center bg-slate-950'><div className='rounded-xl border border-slate-800 bg-slate-900/40 p-8 shadow-card text-center space-y-4'><div className='text-xl font-semibold'>Frame 15 Internal</div><div className='text-slate-400'>Sign in with your <b>@frame15.com</b> Google account.</div><button onClick={login} className='px-4 py-2 rounded-lg bg-brand text-white'>Sign in with Google</button></div></div>); return <><Nav/><Outlet/></> }
export default function App(){ return (<AuthProvider><BrowserRouter><Routes><Route element={<Guarded/>}><Route path='/' element={<Dashboard/>}/><Route path='/projects' element={<Projects/>}/><Route path='/projects/:id' element={<ProjectDetail/>}/><Route path='*' element={<Navigate to='/' replace/>}/></Route></Routes></BrowserRouter></AuthProvider>) }