import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useAuthStore } from '../store/useAuthStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, ArrowRight, FlameKindling, User, KeyRound } from 'lucide-react'
import bgDungeon from '../assets/bg_dungeon.png'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Login() {
  const navigate = useNavigate()
  const { setUser, setToken, setError } = useAuthStore()
  const [isRegister, setIsRegister] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setLocalError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setLocalError('')
    setSuccessMsg('')
  }

  const resetForm = () => {
    setFormData({ username: '', email: '', password: '', passwordConfirm: '' })
    setLocalError('')
    setSuccessMsg('')
  }

  const toggleMode = () => {
    setIsRegister((prev) => !prev)
    resetForm()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setLocalError('')
    setSuccessMsg('')

    if (isRegister) {
      // --- REGISTER ---
      if (formData.password !== formData.passwordConfirm) {
        setLocalError('Passwords do not match.')
        setLoading(false)
        return
      }
      if (formData.password.length < 8) {
        setLocalError('Password must be at least 8 characters.')
        setLoading(false)
        return
      }
      try {
        await authAPI.register(formData.email, formData.password, formData.username)
        setSuccessMsg('Account created! Redirecting to login...')
        setTimeout(() => {
          setIsRegister(false)
          resetForm()
        }, 1500)
      } catch (err) {
        const errorMsg = err.response?.data?.detail || 'Registration failed. Try again.'
        setLocalError(errorMsg)
      } finally {
        setLoading(false)
      }
    } else {
      // --- LOGIN ---
      try {
        const response = await authAPI.login(formData.email, formData.password)
        const { access_token, user } = response.data

        localStorage.setItem('auth_token', access_token)
        localStorage.setItem('auth_user', JSON.stringify(user))

        setUser(user)
        setToken(access_token)

        setTimeout(() => navigate('/dashboard'), 300)
      } catch (err) {
        const errorMsg = err.response?.data?.detail || 'Error al iniciar sesión'
        setLocalError(errorMsg)
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-black">
      {/* Background Image */}
      <motion.div
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgDungeon})` }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[3px]" />
      </motion.div>

      {/* Atmospheric Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

      {/* Login / Register Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="relative z-10 w-full max-w-md px-8 py-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl mx-4"
      >
        {/* Header */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isRegister ? 'register-header' : 'login-header'}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-orange-500/10 mb-4 border border-orange-500/20">
              <FlameKindling className="text-orange-500" size={32} />
            </div>
            <h2 className="font-display text-4xl text-white tracking-widest mb-2 drop-shadow-[0_0_15px_rgba(255,165,0,0.4)]">
              {isRegister ? 'JOIN THE GUILD' : 'ENTER THE KEEP'}
            </h2>
            <p className="font-sans text-gray-400 text-sm tracking-tighter uppercase font-medium">
              {isRegister ? 'Register your name, adventurer.' : 'Identify yourself, traveler.'}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            <motion.div
              key={isRegister ? 'register-fields' : 'login-fields'}
              initial={{ opacity: 0, x: isRegister ? 30 : -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRegister ? -30 : 30 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              {/* Username (register only) */}
              {isRegister && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold ml-1">
                    Adventurer Name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors" size={18} />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-gray-700"
                      placeholder="Sir Lancelot"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold ml-1">
                  Email Address / Messenger Pigeon
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors" size={18} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-gray-700"
                    placeholder="knight@realm.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold ml-1">
                  Secret Phrase / Magic Spell
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors" size={18} />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-gray-700"
                    placeholder="••••••••"
                  />
                </div>
                {isRegister && (
                  <p className="text-[10px] text-red-400 ml-1 mt-1">Minimum 8 characters</p>
                )}
              </div>

              {/* Confirm Password (register only) */}
              {isRegister && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold ml-1">
                    Confirm Your Spell
                  </label>
                  <div className="relative group">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors" size={18} />
                    <input
                      type="password"
                      name="passwordConfirm"
                      value={formData.passwordConfirm}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-gray-700"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-950/40 border border-red-500/50 rounded-lg p-3"
            >
              <p className="text-red-400 text-xs text-center">{error}</p>
            </motion.div>
          )}

          {/* Success Message */}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-green-950/40 border border-green-500/50 rounded-lg p-3"
            >
              <p className="text-green-400 text-xs text-center">{successMsg}</p>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(249, 115, 22, 0.9)" }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-orange-600 text-white font-display tracking-widest py-4 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed group transition-all"
          >
            {loading ? (
              <LoadingSpinner size={24} padding="0" />
            ) : (
              <>
                {isRegister ? 'CREATE ACCOUNT' : 'PROCEED'}{' '}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-[10px] uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors"
          >
            Return to Gates
          </button>

          <div className="pt-4 border-t border-white/5">
            <p className="text-xs text-gray-600">
              {isRegister ? (
                <>
                  Already a member?{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-orange-500/80 hover:text-orange-400 font-semibold transition-colors"
                  >
                    Enter the Keep
                  </button>
                </>
              ) : (
                <>
                  New to the dungeon?{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-orange-500/80 hover:text-orange-400 font-semibold transition-colors"
                  >
                    Request Entry
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
