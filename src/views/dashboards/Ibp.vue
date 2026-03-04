<script setup>
import { ref } from 'vue';
import { Globe, LayoutDashboard, ExternalLink } from 'lucide-vue-next';

// Estado para controle de carregamento
const isLoading = ref(true);

const handleLoad = () => {
  isLoading.value = false;
};
</script>

<template>
  <div class="dashboard-container">
    <!-- CABEÇALHO DO DASHBOARD -->
    <div class="p-4 bg-white shadow-sm d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-3">
        <div class="icon-circle-bg">
          <LayoutDashboard class="text-orange" :size="24"/>
        </div>
        <div>
          <h4 class="fw-bold m-0 text-dark">BI IBP</h4>
          <p class="text-muted small mb-0">Análise Estratégica - TotalEnergies</p>
        </div>
      </div> 
    </div>

    <!-- ÁREA DO POWER BI -->
    <div class="iframe-wrapper p-3">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white h-100 position-relative">
        
        <!-- Spinner de carregamento -->
        <div v-if="isLoading" class="loader-overlay">
          <div class="spinner-border text-orange" role="status"></div>
          <span class="mt-2 fw-bold text-muted">Carregando Relatório...</span>
        </div>

        <!-- CORREÇÃO AQUI: Adicionado @load e class -->
        <iframe 
          title="IBP" 
          class="powerbi-iframe"
          src="https://app.powerbi.com/view?r=eyJrIjoiOGMwNjllODItNDAxYy00ODEzLWE0YTUtODQ2YTk3NGE0NTllIiwidCI6ImEzYTY5ODI1LTA2YTMtNDU0Ny1iZGZkLTBlYWI3MDJmMTcyNiJ9" 
          frameborder="0" 
          allowFullScreen="true"
          @load="handleLoad" 
        ></iframe>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* O CSS permanece o mesmo do anterior */
.dashboard-container {
  background-color: #f1f5f9;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.iframe-wrapper {
  flex-grow: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.powerbi-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 12px;
}

.text-orange { color: #e97332 !important; }
.icon-circle-bg { 
  width: 45px; height: 45px; border-radius: 50%; 
  display: flex; align-items: center; justify-content: center; 
  background: #fff1eb; 
}

.btn-orange-outline { 
  border: 2px solid #e97332; color: #e97332; background: white; 
  transition: 0.3s; text-decoration: none; border-radius: 8px;
}

.btn-orange-outline:hover { background: #fff1eb; color: #d15f22; }

.loader-overlay {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: white; display: flex; flex-direction: column;
  align-items: center; justify-content: center; z-index: 10;
}

.spinner-border.text-orange { color: #e97332 !important; }

@media (max-width: 768px) {
  .powerbi-iframe { height: calc(100vh - 150px); }
}
</style>
