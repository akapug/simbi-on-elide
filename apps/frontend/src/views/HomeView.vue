<template>
  <div class="min-h-screen">
    <Navbar />
    <main>
      <!-- Hero Section -->
      <section class="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div class="container mx-auto px-4 text-center">
          <h1 class="text-5xl font-bold mb-6">Welcome to Simbi</h1>
          <p class="text-xl mb-8">Connect, Trade, and Grow Together</p>
          <div class="flex gap-4 justify-center">
            <router-link to="/register" class="btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 text-lg">
              Get Started
            </router-link>
            <router-link to="/services" class="btn border-2 border-white text-white hover:bg-white/10 px-8 py-3 text-lg">
              Browse Services
            </router-link>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section class="py-16">
        <div class="container mx-auto px-4">
          <h2 class="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div class="grid md:grid-cols-3 gap-8">
            <div class="card text-center">
              <div class="text-4xl mb-4">🎯</div>
              <h3 class="text-xl font-semibold mb-2">Create Listings</h3>
              <p class="text-gray-600">Offer your skills or request services from the community</p>
            </div>
            <div class="card text-center">
              <div class="text-4xl mb-4">💬</div>
              <h3 class="text-xl font-semibold mb-2">Connect & Negotiate</h3>
              <p class="text-gray-600">Message directly and agree on fair exchanges</p>
            </div>
            <div class="card text-center">
              <div class="text-4xl mb-4">✨</div>
              <h3 class="text-xl font-semibold mb-2">Build Community</h3>
              <p class="text-gray-600">Rate, review, and grow your reputation</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent Services -->
      <section class="bg-gray-50 py-16">
        <div class="container mx-auto px-4">
          <h2 class="text-3xl font-bold mb-8">Recent Offerings</h2>
          <div class="grid md:grid-cols-4 gap-6">
            <ServiceCard v-for="service in recentServices" :key="service.id" :service="service" />
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Navbar from '@/components/layout/Navbar.vue'
import Footer from '@/components/layout/Footer.vue'
import ServiceCard from '@/components/services/ServiceCard.vue'
import { useServicesStore } from '@/stores/services'

const servicesStore = useServicesStore()
const recentServices = ref([])

onMounted(async () => {
  await servicesStore.fetchServices({ limit: 8 })
  recentServices.value = servicesStore.services
})
</script>
