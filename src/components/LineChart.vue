<script setup>
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const data = {
  labels: ['jun/25', 'jul/25', 'ago/25', 'set/25', 'out/25', 'nov/25'],
  datasets: [
    {
      label: 'Usuários',
      backgroundColor: '#f97316',
      borderColor: '#f97316',
      data: [0, 0, 0, 0, 1, 0],
      tension: 0.4,
      pointRadius: 5
    }
  ]
}

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { borderDash: [2, 4] } },
    x: { grid: { display: false } }
  }
}
</script>

<template>
  <Line :data="data" :options="options" />
</template>