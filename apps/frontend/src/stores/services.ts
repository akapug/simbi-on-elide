import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'
import type { Service, CreateServiceData, UpdateServiceData, SearchServicesParams, PaginatedResponse } from '@/types'

export const useServicesStore = defineStore('services', () => {
  const services = ref<Service[]>([])
  const currentService = ref<Service | null>(null)
  const loading = ref(false)
  const total = ref(0)
  const page = ref(1)
  const pages = ref(1)

  async function fetchServices(params: SearchServicesParams = {}) {
    loading.value = true
    try {
      const response = await api.get<{ services: Service[]; total: number; page: number; pages: number }>('/services', { params })
      services.value = response.data.services
      total.value = response.data.total
      page.value = response.data.page
      pages.value = response.data.pages
    } finally {
      loading.value = false
    }
  }

  async function fetchService(id: string) {
    loading.value = true
    try {
      const response = await api.get<Service>(`/services/${id}`)
      currentService.value = response.data
      return response.data
    } finally {
      loading.value = false
    }
  }

  async function createService(data: CreateServiceData) {
    const response = await api.post<Service>('/services', data)
    return response.data
  }

  async function updateService(id: string, data: UpdateServiceData) {
    const response = await api.put<Service>(`/services/${id}`, data)
    return response.data
  }

  async function likeService(id: string) {
    await api.post(`/services/${id}/like`)
  }

  async function unlikeService(id: string) {
    await api.delete(`/services/${id}/unlike`)
  }

  return {
    services,
    currentService,
    loading,
    total,
    page,
    pages,
    fetchServices,
    fetchService,
    createService,
    updateService,
    likeService,
    unlikeService,
  }
})
