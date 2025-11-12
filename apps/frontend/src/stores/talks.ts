import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'
import type { Talk, Message, CreateTalkData, SendMessageData, CreateOfferData, Offer } from '@/types'

export const useTalksStore = defineStore('talks', () => {
  const talks = ref<Talk[]>([])
  const currentTalk = ref<(Talk & { messages: Message[] }) | null>(null)
  const loading = ref(false)

  async function fetchTalks() {
    loading.value = true
    try {
      const response = await api.get<Talk[]>('/talks')
      talks.value = response.data
    } finally {
      loading.value = false
    }
  }

  async function fetchTalk(id: string) {
    loading.value = true
    try {
      const response = await api.get<Talk & { messages: Message[] }>(`/talks/${id}`)
      currentTalk.value = response.data
      return response.data
    } finally {
      loading.value = false
    }
  }

  async function createTalk(data: CreateTalkData) {
    const response = await api.post<Talk>('/talks', data)
    return response.data
  }

  async function sendMessage(talkId: string, data: SendMessageData) {
    const response = await api.post<Message>(`/talks/${talkId}/message`, data)
    if (currentTalk.value?.id === talkId) {
      currentTalk.value.messages.push(response.data)
    }
    return response.data
  }

  async function createOffer(talkId: string, data: CreateOfferData) {
    const response = await api.post<Offer>(`/talks/${talkId}/offer`, data)
    return response.data
  }

  return {
    talks,
    currentTalk,
    loading,
    fetchTalks,
    fetchTalk,
    createTalk,
    sendMessage,
    createOffer,
  }
})
