<template>
  <footer class="bg-gray-900 text-white py-12 mt-16">
    <div class="container mx-auto px-4">
      <div class="grid md:grid-cols-4 gap-8">
        <div>
          <h3 class="text-xl font-bold mb-4">Simbi</h3>
          <p class="text-gray-400">Building a symbiotic economy, one exchange at a time.</p>
        </div>
        <div>
          <h4 class="font-semibold mb-4">Platform</h4>
          <ul class="space-y-2 text-gray-400">
            <li><router-link to="/services">Browse Services</router-link></li>
            <li><router-link to="/communities">Communities</router-link></li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold mb-4">Support</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="#">Help Center</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold mb-4">Legal</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
        <p>&copy; 2025 Simbi. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>
