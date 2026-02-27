<script setup>
defineProps({
  title: String,
  value: String,
  trend: String,
  trendColor: { type: String, default: 'text-success' }, // text-success ou text-danger
  iconClass: String // Classe de fundo personalizada (ex: bg-orange-subtle)
})
</script>

<template>
  <div class="card border-0 shadow-sm h-100">
    <div class="card-body d-flex justify-content-between align-items-start">
      <div>
        <p class="text-muted fw-bold mb-1" style="font-size: 0.85rem;">{{ title }}</p>
        <h2 class="fw-bold text-dark mb-1">{{ value }}</h2>
        <small :class="trendColor" class="fw-semibold" style="font-size: 0.8rem;">{{ trend }}</small>
      </div>
      <div :class="`p-3 rounded ${iconClass}`">
        <slot></slot>
      </div>
    </div>
  </div>
</template>