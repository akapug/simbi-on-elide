<template>
  <div class="min-h-screen">
    <Navbar />
    <main class="container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">Browse Services</h1>
        <router-link to="/services/create" class="btn btn-primary">Create Listing</router-link>
      </div>

      <!-- Filters -->
      <div class="card mb-8">
        <div class="grid md:grid-cols-4 gap-4">
          <input
            v-model="filters.query"
            type="text"
            placeholder="Search..."
            class="input"
            @input="handleSearch"
          />
          <select v-model="filters.kind" class="input" @change="handleSearch">
            <option value="">All Types</option>
            <option value="offered">Offered</option>
            <option value="requested">Requested</option>
            <option value="product">Products</option>
          </select>
          <select v-model="filters.tradingType" class="input" @change="handleSearch">
            <option value="">All Trading Types</option>
            <option value="simbi">Simbi Credits</option>
            <option value="exchange">Direct Exchange</option>
            <option value="usd">USD</option>
          </select>
        </div>
      </div>

      <!-- Services Grid -->
      <div v-if="servicesStore.loading" class="text-center py-12">
        <div class="text-gray-500">Loading...</div>
      </div>

      <div v-else class="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
        <ServiceCard v-for="service in servicesStore.services" :key="service.id" :service="service" />
      </div>

      <!-- Pagination -->
      <div v-if="servicesStore.pages > 1" class="mt-8 flex justify-center gap-2">
        <button
          v-for="page in servicesStore.pages"
          :key="page"
          @click="goToPage(page)"
          :class="['px-4 py-2 rounded', page === servicesStore.page ? 'bg-primary-600 text-white' : 'bg-gray-200']"
        >
          {{ page }}
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import Navbar from '@/components/layout/Navbar.vue'
import ServiceCard from '@/components/services/ServiceCard.vue'
import { useServicesStore } from '@/stores/services'

const servicesStore = useServicesStore()

const filters = reactive({
  query: '',
  kind: '',
  tradingType: '',
})

async function handleSearch() {
  await servicesStore.fetchServices(filters)
}

async function goToPage(page: number) {
  await servicesStore.fetchServices({ ...filters, page })
}

onMounted(async () => {
  await servicesStore.fetchServices()
})
</script>
