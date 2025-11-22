import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  const setAuth = (userData, authToken) => {
    user.value = userData
    token.value = authToken
    localStorage.setItem('token', authToken)
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
  }

  const clearAuth = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
  }

  const checkAuth = async () => {
    if (token.value) {
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
        const response = await api.get('/auth/me')
        user.value = response.data
      } catch (error) {
        clearAuth()
      }
    }
  }

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    setAuth(response.data.user, response.data.token)
    return response.data
  }

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData)
    setAuth(response.data.user, response.data.token)
    return response.data
  }

  const logout = () => {
    clearAuth()
  }

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    setAuth,
    clearAuth,
    checkAuth,
    login,
    register,
    logout
  }
})