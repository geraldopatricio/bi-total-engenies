<script setup>
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { Eye, EyeOff, AlertTriangle, CheckCircle, X, Mail } from 'lucide-vue-next';

// IMPORTAÇÃO DA "BASE DE DADOS"
import usuariosDB from '@/data/acesso.json';

const router = useRouter();

// === ESTADOS DE LOGIN ===
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const isLoading = ref(false);

// === ESTADOS DE REGISTRO / RECUPERAÇÃO ===
const showRegisterModal = ref(false);
const regName = ref('');
const regEmail = ref('');
const regPassword = ref('');
const showRegPassword = ref(false);
const isRegistering = ref(false);

const showForgotModal = ref(false);
const forgotEmail = ref('');
const isSendingForgot = ref(false);

// === SISTEMA DE TOAST (ALERTA) ===
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
const toggleRegPassword = () => showRegPassword.value = !showRegPassword.value;

// === LÓGICA DE LOGIN (ATUALIZADA PARA USAR O JSON) ===
const handleLogin = async () => {
  toastMessage.value = '';
  isLoading.value = true;

  // Simular um pequeno delay de rede para ficar natural
  await new Promise(resolve => setTimeout(resolve, 800));

  try {
    // Busca o usuário no arquivo JSON
    const usuarioEncontrado = usuariosDB.find(user => 
      user.email.toLowerCase() === email.value.toLowerCase() && 
      user.senha === password.value
    );

    if (usuarioEncontrado) {
      // Verifica se o usuário está ativo
      if (usuarioEncontrado.status !== 'ativo') {
        throw new Error('Este usuário está inativo. Entre em contato com o suporte.');
      }

      // Salva informações no localStorage (simulando sessão)
      localStorage.setItem('authToken', `token-fake-${usuarioEncontrado.id}`);
      localStorage.setItem('user_info', JSON.stringify({
        nome: usuarioEncontrado.nome,
        tipo: usuarioEncontrado.tipo,
        email: usuarioEncontrado.email
      }));
      
      showToast(`Bem-vindo, ${usuarioEncontrado.nome}!`, 'success');
      
      setTimeout(() => {
        router.push('/');
      }, 800);

    } else {
      // Se não encontrar no JSON, tenta a API original ou dá erro
      // Aqui vamos priorizar o erro de "Credenciais Inválidas"
      throw new Error('E-mail ou senha incorretos.');
    }

  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    isLoading.value = false;
  }
};

// Lógica de Registro (Apenas Visual, pois o JS do navegador não consegue salvar em arquivos locais por segurança)
const handleRegister = async () => {
  showToast('Funcionalidade de cadastro requer backend para gravar no arquivo.', 'error');
};

const handleForgotPassword = async () => {
  showToast('Funcionalidade de recuperação requer integração de e-mail.', 'success');
};

const openModal = () => { showRegisterModal.value = true; };
const openForgotModal = () => { showForgotModal.value = true; };
</script>

<template>
  <div class="d-flex align-items-center justify-content-center min-vh-100 bg-light position-relative overflow-hidden">
    
    <!-- === ALERTA FLUTUANTE (TOAST) === -->
    <Transition name="toast">
      <div v-if="toastMessage" :class="['custom-toast', toastType === 'success' ? 'toast-success' : 'toast-error']">
        <CheckCircle v-if="toastType === 'success'" class="me-2" :size="20" />
        <AlertTriangle v-else class="me-2" :size="20" />
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
    
    <!-- CARD DE LOGIN -->
    <div class="card border-0 shadow-lg p-4" style="max-width: 400px; width: 100%;">
      <div class="card-body">
        
        <div class="text-center mb-4">
          <div class="p-2 d-inline-flex align-items-center justify-content-center mb-3">
            <img src="/Lubx_01.png" alt="Logo" style="width: 200px; height: 52px;">
          </div>
          <h4 class="fw-bold text-dark">Área de Acesso</h4>
          <p class="text-muted small">BUSINESS INTELLIGENCE - TOTAL ENERGIES</p>
        </div>

        <form @submit.prevent="handleLogin">
          <div class="form-floating mb-3 custom-floating">
            <input type="email" class="form-control" id="emailInput" placeholder="name@example.com" v-model="email" required :disabled="isLoading">
            <label for="emailInput">E-mail</label>
          </div>

          <div class="form-floating mb-3 position-relative custom-floating">
            <input :type="showPassword ? 'text' : 'password'" class="form-control pe-5" id="passwordInput" placeholder="Senha" v-model="password" required :disabled="isLoading">
            <label for="passwordInput">Senha</label>
            <button type="button" class="btn btn-link position-absolute text-muted p-0" style="top: 50%; right: 15px; transform: translateY(-50%); z-index: 10;" @click="togglePassword" :disabled="isLoading">
              <Eye v-if="!showPassword" :size="20" />
              <EyeOff v-else :size="20" />
            </button>
          </div>

          <div class="d-flex justify-content-between align-items-center mb-4">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="remember" :disabled="isLoading">
              <label class="form-check-label small text-muted" for="remember">Lembrar-me</label>
            </div>
            <a href="#" class="small text-primary text-decoration-none fw-bold" @click.prevent="openForgotModal">Esqueceu a senha?</a>
          </div>

          <button type="submit" class="btn btn-primary w-100 py-2 fw-bold text-white shadow-sm hover-effect d-flex justify-content-center align-items-center gap-2" :disabled="isLoading">
            <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status"></span>
            {{ isLoading ? 'Validando...' : 'Entrar no Sistema' }}
          </button>
        </form>

      </div>
      <div class="card-footer bg-white border-0 text-center py-3">
        <small class="text-muted">Não tem uma conta? 
          <a href="#" class="text-primary fw-bold text-decoration-none" @click.prevent="openModal">Criar conta</a>
        </small>
      </div>
    </div>

    <!-- MODAIS (CÓDIGO ORIGINAL MANTIDO...) -->
    <!-- ... (restante dos modais e estilos permanecem iguais ao seu arquivo original) ... -->
  </div>
</template>

<style scoped>
/* Estilos originais mantidos */
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

.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 1050; }
.overlay-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(2px); }
.modal-content { z-index: 1060; background: white; animation: modal-up 0.3s ease-out; }
@keyframes modal-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.custom-floating > .form-control { border-radius: 8px; border: 1px solid #dee2e6; height: 50px; padding-top: 0.625rem; padding-bottom: 0.625rem; }
.custom-floating > .form-control:focus { box-shadow: none; border-color: #0056b3; border-width: 2px; }
.custom-floating > label { padding: 0.7rem 0.75rem; color: #6c757d; pointer-events: none; transition: all 0.2s ease-in-out; }
.custom-floating > .form-control:focus ~ label, .custom-floating > .form-control:not(:placeholder-shown) ~ label { opacity: 1; transform: scale(0.85) translateY(-0.8rem) translateX(0.65rem); background-color: white; padding: 0 5px; height: auto; color: #0056b3; z-index: 5; }
.hover-effect:hover { filter: brightness(1.1); transition: 0.3s; }
</style>
