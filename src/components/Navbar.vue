<script setup>
import { ref, onMounted } from 'vue';
import { Menu, User } from 'lucide-vue-next';

defineEmits(['toggle-sidebar']);

const userEmail = ref('');
const userName = ref('Bem vindo!'); // Valor padrão caso não tenha nome no token

onMounted(() => {
  const token = localStorage.getItem('authToken');

  if (token) {
    try {
      // Decodificação do Token JWT
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      
      // Preenche o Email
      userEmail.value = payload.email || '';

      // Preenche o Nome (Se existir no token, senão mantém 'Bem vindo!')
      if (payload.nome) {
        userName.value = payload.nome;
      }
      
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
    }
  }
});
</script>

<template>
  <header class="navbar navbar-expand bg-white border-bottom sticky-top px-3 py-3">
    
    <!-- Botão Hambúrguer -->
    <button 
      class="btn btn-light d-md-none me-3 border" 
      @click="$emit('toggle-sidebar')"
    >
      <Menu :size="20" />
    </button>

    <div class="d-flex flex-column">
      <h5 class="fw-bold m-0 text-dark" style="font-size: 1.1rem;">BUSINESS INTELLIGENCE - TOTALENERGIES</h5>
      <small class="text-muted d-none d-sm-block">Sistema de Gestão Automotiva da LubConsulta</small>
    </div>

    <div class="ms-auto d-flex align-items-center gap-3">
      <div class="text-end d-none d-md-block">
        <!-- AQUI: Mostra o Nome do usuário vindo do Token -->
        <div class="fw-bold text-dark" style="font-size: 0.9rem;">{{ userName }}</div>
        <!-- Mostra o Email do usuário -->
        <div class="text-muted" style="font-size: 0.8rem;">{{ userEmail }}</div>
      </div>
      
      <!-- Avatar Padrão -->
      <div class="avatar-circle d-flex align-items-center justify-content-center bg-light border text-secondary">
        <User :size="24" />
      </div>

    </div>
  </header>
</template>

<style scoped>
.avatar-circle {
  width: 40px; 
  height: 40px; 
  border-radius: 50%;
}
</style>
