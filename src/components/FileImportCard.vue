<script setup>
import { ref } from 'vue';
import { UploadCloud, CheckCircle, AlertCircle, FileText } from 'lucide-vue-next';

// Recebe o título da página como propriedade
defineProps({
  title: String,
  description: String
});

const file = ref(null);
const progress = ref(0);
const isUploading = ref(false);
const status = ref('idle'); // idle, uploading, success, error

// Ao selecionar arquivo
const handleFileChange = (event) => {
  const selected = event.target.files[0];
  if (selected) {
    file.value = selected;
    status.value = 'idle';
    progress.value = 0;
  }
};

// Simulação de Upload
const startImport = () => {
  if (!file.value) return;

  isUploading.value = true;
  status.value = 'uploading';
  progress.value = 0;

  // Intervalo para simular o carregamento (0 a 100%)
  const interval = setInterval(() => {
    if (progress.value >= 100) {
      clearInterval(interval);
      isUploading.value = false;
      status.value = 'success';
    } else {
      // Incrementa aleatoriamente para parecer real
      progress.value += Math.floor(Math.random() * 15) + 5;
      if (progress.value > 100) progress.value = 100;
    }
  }, 300); // Velocidade da simulação
};
</script>

<template>
  <div class="container-fluid p-4">
    <h4 class="fw-bold text-dark mb-4">{{ title }}</h4>
    
    <div class="card border-0 shadow-sm">
      <div class="card-body p-5 text-center">
        
        <!-- Ícone Topo -->
        <div class="mb-4">
            <div class="bg-orange-subtle rounded-circle d-inline-flex align-items-center justify-content-center" style="width: 80px; height: 80px;">
                <UploadCloud :size="40" class="text-primary" />
            </div>
        </div>

        <h5 class="fw-bold mb-2">Selecione o arquivo CSV ou Excel</h5>
        <p class="text-muted small mb-4">{{ description || 'Faça o upload da planilha para atualizar os registros do sistema.' }}</p>

        <!-- Input de Arquivo Customizado -->
        <div class="mb-4 d-flex justify-content-center">
            <div class="input-group" style="max-width: 500px;">
                <input type="file" class="form-control" id="inputGroupFile" @change="handleFileChange" accept=".csv, .xlsx, .xls">
            </div>
        </div>

        <!-- Botão Importar -->
        <button 
            class="btn btn-primary fw-bold px-5 py-2 text-white" 
            :disabled="!file || isUploading || status === 'success'"
            @click="startImport"
        >
            <span v-if="isUploading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            {{ isUploading ? 'Importando...' : (status === 'success' ? 'Concluído' : 'Iniciar Importação') }}
        </button>

        <!-- Barra de Progresso -->
        <div v-if="status === 'uploading' || status === 'success'" class="mt-4" style="max-width: 500px; margin: 0 auto;">
            <div class="d-flex justify-content-between small fw-bold mb-1">
                <span class="text-primary">Progresso</span>
                <span class="text-dark">{{ progress }}%</span>
            </div>
            <div class="progress" style="height: 10px; border-radius: 10px;">
                <div 
                    class="progress-bar bg-primary progress-bar-striped progress-bar-animated" 
                    role="progressbar" 
                    :style="{ width: progress + '%' }" 
                ></div>
            </div>
        </div>

        <!-- Mensagem de Sucesso -->
        <div v-if="status === 'success'" class="alert alert-success mt-4 d-flex align-items-center justify-content-center gap-2" role="alert" style="max-width: 500px; margin: 20px auto 0;">
            <CheckCircle :size="20" />
            Importação do arquivo <strong>{{ file.name }}</strong> realizada com sucesso!
        </div>

      </div>
    </div>
  </div>
</template>