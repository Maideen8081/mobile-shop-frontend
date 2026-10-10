import api from './api'

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

interface ChatReplyResponse {
  success: boolean
  reply: string
  source: 'ai' | 'rule'
}

const CHAT_URL = '/api/v1/chat/'

/**
 * Send a message to the PhoneFix Assistant backend. Throws when the request
 * fails or the reply is empty so the caller can fall back gracefully.
 */
export async function sendChatMessage(message: string, history: ChatTurn[] = []): Promise<string> {
  const response = await api.post<ChatReplyResponse>(CHAT_URL, { message, history })
  const reply = response.data?.reply
  if (typeof reply !== 'string' || !reply.trim()) {
    throw new Error('Empty reply from chat service')
  }
  return reply
}
