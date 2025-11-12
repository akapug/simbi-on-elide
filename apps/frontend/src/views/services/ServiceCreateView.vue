<template>
  <div class="min-h-screen">
    <Navbar />
    <main class="container mx-auto px-4 py-8 max-w-3xl">
      <h1 class="text-3xl font-bold mb-8">Create Service Listing</h1>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="card">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select v-model="form.kind" class="input" required>
                <option value="offered">Offered (I can provide this)</option>
                <option value="requested">Requested (I need this)</option>
                <option value="product">Product (For sale)</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input v-model="form.title" type="text" class="input" required placeholder="What are you offering?" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea v-model="form.description" class="input" rows="5" required></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Trading Type</label>
              <select v-model="form.tradingType" class="input" required>
                <option value="simbi">Simbi Credits</option>
                <option value="exchange">Direct Exchange</option>
                <option value="flexible">Flexible</option>
                <option value="usd">USD Payment</option>
              </select>
            </div>

            <div v-if="form.tradingType === 'simbi'" class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Simbi Price</label>
                <input v-model.number="form.simbiPrice" type="number" class="input" min="1" />
              </div>
            </div>

            <div v-if="form.tradingType === 'usd'" class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">USD Price</label>
                <input v-model.number="form.usdPrice" type="number" class="input" step="0.01" min="0" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
              <input v-model="tagsInput" type="text" class="input" placeholder="design, marketing, web" />
            </div>
          </div>
        </div>

        <div class="flex gap-4">
          <button type="submit" :disabled="loading" class="btn btn-primary">
            {{ loading ? 'Creating...' : 'Create Listing' }}
          </button>
          <router-link to="/dashboard" class="btn btn-secondary">Cancel</router-link>
        </div>
      </form>
    </main>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '@/components/layout/Navbar.vue'
import { useServicesStore } from '@/stores/services'

const router = useRouter()
const servicesStore = useServicesStore()
const loading = ref(false)
const tagsInput = ref('')

const form = reactive({
  kind: 'offered',
  title: '',
  description: '',
  tradingType: 'simbi',
  simbiPrice: null,
  usdPrice: null,
  tags: [],
})

async function handleSubmit() {
  loading.value = true
  try {
    form.tags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean)
    const service = await servicesStore.createService(form)
    router.push(`/services/${service.id}`)
  } catch (error) {
    console.error('Failed to create service:', error)
  } finally {
    loading.value = false
  }
}
</script>
