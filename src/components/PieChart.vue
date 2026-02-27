<script setup>
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const data = {
  labels: ['Cartão', 'Boleto', 'PIX', 'Grátis'],
  datasets: [
    {
      backgroundColor: ['#eab308', '#3b82f6', '#22c55e', '#f97316'],
      data: [100, 0, 0, 0],
      borderWidth: 0
    }
  ]
}

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } }
}
</script>

<template>
  <Pie :data="data" :options="options" />
</template>