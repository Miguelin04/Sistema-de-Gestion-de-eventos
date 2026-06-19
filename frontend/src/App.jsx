import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import GoogleHybrid from './pages/GoogleHybrid'
import Recover from './pages/Recover'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import VerificarCuenta from './pages/VerificarCuenta'

/**
 * Componente de protección de ruta por Rol (Permite Admin '1' y Usuario '2')
 */
const GuardedRoute = ({ element: Element }) => {
  // Para propósitos de este microservicio aislado, permitimos acceso directo
  return <Element />
}

export default function App() {
  const token = localStorage.getItem('access_token')
  const idRol = localStorage.getItem('id_rol')

  // El usuario puede ir al dashboard desde la raíz si tiene token y rol válido
  const isUserValid = true // Forzamos acceso directo al dashboard

  return (
    <>
    <Routes>
      {/* Ruta raíz: Redirige directamente al Dashboard para probar el microservicio aislado */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      {/* Rutas Públicas de Autenticación */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/google-register" element={<GoogleHybrid mode="google-register" />} />
      <Route path="/registro-hibrido" element={<GoogleHybrid mode="registro-hibrido" />} />
      <Route path="/recover" element={<Recover />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verificar-cuenta" element={<VerificarCuenta />} />

      {/* Ruta Privada Protegida y Controlada por Rol */}
      <Route
        path="/dashboard"
        element={<GuardedRoute element={Dashboard} />}
      />

      {/* Redirección por si escriben cualquier otra ruta inexistente */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <Toaster position="top-right" reverseOrder={false} />
    </>
  )
}