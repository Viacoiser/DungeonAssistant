import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Obtener instancia de axios para hacer llamadas raw
 * Útil para operaciones como validación de token en App.jsx
 */
export const getAuthAPI = () => api

// Auth
export const authAPI = {
  register: (email, password, username) =>
    api.post('/auth/register', { email, password, username }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
}

// Campaigns
export const campaignAPI = {
  create: (name, description) =>
    api.post('/campaigns', { name, description }),
  list: () => api.get('/campaigns'),
  getDetail: (campaignId) =>
    api.get(`/campaigns/${campaignId}`),
  update: (campaignId, data) =>
    api.patch(`/campaigns/${campaignId}`, data),
  delete: (campaignId) =>
    api.delete(`/campaigns/${campaignId}`),
  joinByCode: (invite_code) =>
    api.post('/campaigns/join', { invite_code }),
  getMembers: (campaignId) =>
    api.get(`/campaigns/${campaignId}/members`),
  regenerateCode: (campaignId) =>
    api.post(`/campaigns/${campaignId}/regenerate-code`),
}

// Characters
export const characterAPI = {
  create: (data) => api.post('/characters', data),
  list: (campaignId = null) => 
    campaignId 
      ? api.get(`/characters?campaign_id=${campaignId}`)
      : api.get(`/characters`),
  getDetail: (characterId) =>
    api.get(`/characters/${characterId}`),
  update: (characterId, data) =>
    api.put(`/characters/${characterId}`, data),
  getHistory: (characterId) =>
    api.get(`/characters/${characterId}/history`),
  updateStatus: (characterId, isAlive) =>
    api.put(`/characters/${characterId}/status`, { is_alive: isAlive }),
}

// Sessions
export const sessionAPI = {
  create: (campaignId, sessionNumber, title) =>
    api.post('/sessions', { campaign_id: campaignId, session_number: sessionNumber, title }),
  listByCampaign: (campaignId) =>
    api.get(`/sessions/campaign/${campaignId}`),
  start: (sessionId) =>
    api.post(`/sessions/${sessionId}/start`),
  end: (sessionId) =>
    api.post(`/sessions/${sessionId}/end`),
  addNote: (sessionId, content) =>
    api.post(`/sessions/${sessionId}/notes`, { content }),
  getNotes: (sessionId) =>
    api.get(`/sessions/${sessionId}/notes`),
  updateNote: (noteId, content) =>
    api.patch(`/sessions/notes/${noteId}`, { content }),
  deleteNote: (noteId) =>
    api.delete(`/sessions/notes/${noteId}`),
  toggleNoteVisibility: (noteId, isPublic) =>
    api.patch(`/sessions/notes/${noteId}/visibility`, { is_public: isPublic }),
  delete: (sessionId) =>
    api.delete(`/sessions/${sessionId}`),
}

// NPCs
export const npcAPI = {
  list: (campaignId) =>
    api.get(`/campaigns/${campaignId}/npcs`),
  generate: (campaignId, prompt) =>
    api.post(`/campaigns/${campaignId}/npcs`, { prompt }),
  update: (campaignId, npcId, data) =>
    api.patch(`/campaigns/${campaignId}/npcs/${npcId}`, data),
  delete: (campaignId, npcId) =>
    api.delete(`/campaigns/${campaignId}/npcs/${npcId}`),
  generateTrait: (campaignId, npcId) =>
    api.post(`/campaigns/${campaignId}/npcs/${npcId}/trait`),
}

// Assistant
export const assistantAPI = {
  chat: (campaignId, question) =>
    api.post('/assistant/chat', { campaign_id: campaignId, question }),
}

// Vision / OCR
export const visionAPI = {
  digitize: (campaignId, imageUrl) =>
    api.post('/vision/digitize', { campaign_id: campaignId, image_url: imageUrl }),
}

// D&D5e Search
export const dnd5eAPI = {
  search: (query, categories = null, limit = 10) => {
    const params = { q: query, limit }
    if (categories) params.categories = categories.join(',')
    return api.get('/api/dnd5e/search', { params })
  },
  autocomplete: (query, categories = null, limit = 5) => {
    const params = { q: query, limit }
    if (categories) params.categories = categories.join(',')
    return api.get('/api/dnd5e/autocomplete', { params })
  },
  analyzeNote: (content) =>
    api.post('/api/dnd5e/analyze-note', { content }),
}

export default api
