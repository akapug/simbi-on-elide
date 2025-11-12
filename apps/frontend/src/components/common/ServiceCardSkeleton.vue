<template>
  <div class="service-card-skeleton">
    <LoadingSkeleton variant="rectangular" height="200px" />
    <div class="card-body">
      <div class="card-header">
        <LoadingSkeleton variant="circular" width="40px" height="40px" />
        <div class="header-text">
          <LoadingSkeleton width="120px" height="16px" />
          <LoadingSkeleton width="80px" height="14px" />
        </div>
      </div>
      <LoadingSkeleton variant="text" width="100%" />
      <LoadingSkeleton variant="text" width="90%" />
      <LoadingSkeleton variant="text" width="80%" />
      <div class="card-footer">
        <LoadingSkeleton width="60px" height="20px" />
        <LoadingSkeleton width="100px" height="32px" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LoadingSkeleton from './LoadingSkeleton.vue'
</script>

<style scoped>
.service-card-skeleton {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-body {
  padding: 1.25rem;
}

.card-header {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1rem;
}

.header-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}
</style>
