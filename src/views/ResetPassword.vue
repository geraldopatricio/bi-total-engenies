<script setup>
import { useRouter, useRoute } from 'vue-router';
import { ref, onMounted } from 'vue';
import { Eye, EyeOff, AlertTriangle, CheckCircle, KeyRound, ArrowLeft } from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();

const token = ref('');
const newPassword = ref('');
const showPassword = ref(false);
const isLoading = ref(false);

const toastMessage = ref('');
const toastType = ref('error');

const showToast = (msg, type = 'error') => {
  toastMessage.value = msg;
  toastType.value = type;
  setTimeout(() => {
    toastMessage.value = '';
  }, 5000);
};

const togglePassword = () => showPassword.value = !showPassword.value;

// Tenta pegar o token da URL se vier no link do email (ex: ?token=XYZ)
onMounted(() => {
  if (route.query.token) {
    token.value = route.query.token;
  }
});

const handleReset = async () => {
  toastMessage.value = '';
  isLoading.value = true;

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/usuarios/resetar-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token: token.value, 
        novaSenha: newPassword.value 
      })
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.erro || 'Erro ao redefinir senha');

    showToast('Senha alterada com sucesso! Redirecionando...', 'success');
    
    setTimeout(() => {
      router.push('/login');
    }, 2000);

  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="d-flex align-items-center justify-content-center min-vh-100 bg-light position-relative overflow-hidden">
    
    <!-- TOAST -->
    <Transition name="toast">
      <div v-if="toastMessage" :class="['custom-toast', toastType === 'success' ? 'toast-success' : 'toast-error']">
        <CheckCircle v-if="toastType === 'success'" class="me-2" :size="20" />
        <AlertTriangle v-else class="me-2" :size="20" />
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <div class="card border-0 shadow-lg p-4" style="max-width: 400px; width: 100%;">
      <div class="card-body">
        
        <div class="text-center mb-4">
          <div class="bg-primary text-white rounded-circle p-3 d-inline-flex mb-3">
             <KeyRound :size="24" />
          </div>
          <h4 class="fw-bold text-dark">Redefinir Senha</h4>
          <p class="text-muted small">Insira o token recebido e sua nova senha.</p>
        </div>

        <form @submit.prevent="handleReset">
          
          <!-- Token -->
          <div class="form-floating mb-3 custom-floating">
            <input type="text" class="form-control" id="tokenInput" placeholder="Token" v-model="token" required :disabled="isLoading">
            <label for="tokenInput">Token</label>
          </div>

          <!-- Nova Senha -->
          <div class="form-floating mb-3 position-relative custom-floating">
            <input :type="showPassword ? 'text' : 'password'" class="form-control pe-5" id="newPassInput" placeholder="Nova Senha" v-model="newPassword" required :disabled="isLoading">
            <label for="newPassInput">Nova Senha</label>
            <button type="button" class="btn btn-link position-absolute text-muted p-0" style="top: 50%; right: 15px; transform: translateY(-50%); z-index: 10;" @click="togglePassword" :disabled="isLoading">
              <Eye v-if="!showPassword" :size="20" />
              <EyeOff v-else :size="20" />
            </button>
          </div>

          <button type="submit" class="btn btn-primary w-100 py-2 fw-bold text-white shadow-sm hover-effect d-flex justify-content-center align-items-center gap-2" :disabled="isLoading">
            <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status"></span>
            {{ isLoading ? 'Alterando...' : 'Confirmar Alteração' }}
          </button>
        </form>

      </div>
      <div class="card-footer bg-white border-0 text-center py-3">
        <a href="#" class="small text-muted text-decoration-none d-flex align-items-center justify-content-center gap-1" @click.prevent="router.push('/login')">
          <ArrowLeft :size="16" /> Voltar para o Login
        </a>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Mesmos estilos do Login.vue para manter consistência */
.custom-toast {
  position: fixed; top: 50px; left: 50%; transform: translateX(-50%);
  color: white; padding: 12px 24px; border-radius: 50px;
  box-shadow: 0 10px 25px rgba(0,0,0, 0.2); z-index: 9999;
  display: flex; align-items: center; font-weight: 600; font-size: 0.9rem; pointer-events: none;
}
.toast-error { background-color: #ef4444; }
.toast-success { background-color: #22c55e; }
.toast-enter-active { animation: bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.toast-leave-active { transition: all 0.5s ease-out; }
.toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(-50px); }
@keyframes bounce-in {
  0% { opacity: 0; top: -100px; transform: translateX(-50%); }
  60% { opacity: 1; top: 60px; }
  100% { top: 50px; transform: translateX(-50%); }
}
.custom-floating > .form-control { border-radius: 8px; border: 1px solid #dee2e6; height: 50px; padding-top: 0.625rem; padding-bottom: 0.625rem; }
.custom-floating > .form-control:focus { box-shadow: none; border-color: #f97316; border-width: 2px; }
.custom-floating > label { padding: 0.7rem 0.75rem; color: #6c757d; pointer-events: none; transition: all 0.2s ease-in-out; }
.custom-floating > .form-control:focus ~ label, .custom-floating > .form-control:not(:placeholder-shown) ~ label { opacity: 1; transform: scale(0.85) translateY(-0.8rem) translateX(0.65rem); background-color: white; padding: 0 5px; height: auto; color: #f97316; z-index: 5; }
.custom-floating > .form-control:not(:placeholder-shown):not(:focus) ~ label { color: #6c757d; }
.hover-effect:hover { filter: brightness(1.1); transition: 0.3s; }
</style>