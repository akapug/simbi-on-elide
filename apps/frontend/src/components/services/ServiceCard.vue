<template>
  <router-link :to="`/services/${service.id}`" class="card hover:shadow-md transition-shadow cursor-pointer">
    <div v-if="service.images?.length" class="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
      <img :src="service.images[0]" :alt="service.title" class="w-full h-full object-cover" />
    </div>
    <div v-else class="aspect-video bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg mb-4"></div>

    <h3 class="font-semibold text-lg mb-2">{{ service.title }}</h3>
    <p class="text-gray-600 text-sm mb-4 line-clamp-2">{{ service.description }}</p>

    <div class="flex items-center justify-between text-sm">
      <span class="px-2 py-1 bg-primary-100 text-primary-700 rounded">{{ service.kind }}</span>
      <div class="flex items-center gap-2">
        <span v-if="service.simbiPrice" class="font-semibold">{{ service.simbiPrice }} ⚡</span>
        <span v-if="service.usdPrice" class="font-semibold">${{ (service.usdPrice / 100).toFixed(2) }}</span>
      </div>
    </div>

    <div class="mt-3 flex items-center text-sm text-gray-500">
      <img v-if="service.user?.avatar" :src="service.user.avatar" class="w-6 h-6 rounded-full mr-2" />
      <span>{{ service.user?.firstName }} {{ service.user?.lastName }}</span>
    </div>
  </router-link>
</template>

<script setup lang="ts">
defineProps<{
  service: any
}>()
</script>
