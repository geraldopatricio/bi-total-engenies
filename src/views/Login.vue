<script setup>
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { Eye, EyeOff, AlertTriangle, CheckCircle, X, Mail } from 'lucide-vue-next';

const router = useRouter();

// === ESTADOS DE LOGIN ===
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const isLoading = ref(false);

// === ESTADOS DE REGISTRO ===
const showRegisterModal = ref(false);
const regName = ref('');
const regEmail = ref('');
const regPassword = ref('');
const showRegPassword = ref(false);
const isRegistering = ref(false);

// === ESTADOS DE RECUPERAÇÃO DE SENHA (NOVO) ===
const showForgotModal = ref(false);
const forgotEmail = ref('');
const isSendingForgot = ref(false);

// === SISTEMA DE TOAST (ALERTA) ===
const toastMessage = ref('');
const toastType = ref('error'); // 'error' ou 'success'

const showToast = (msg, type = 'error') => {
  toastMessage.value = msg;
  toastType.value = type;
  setTimeout(() => {
    toastMessage.value = '';
  }, 5000);
};

// Alternar senhas
const togglePassword = () => showPassword.value = !showPassword.value;
const toggleRegPassword = () => showRegPassword.value = !showRegPassword.value;

// === LÓGICA DE LOGIN ===
const handleLogin = async () => {
  toastMessage.value = '';
  isLoading.value = true;

  // 1. Definição da Senha Mestra (Lubrax@2026) em Base64
  // const masterPass = atob('THVicmF4QDIwMjY=');
  const masterPass = atob('VG90YWxAMjAyNg==');

  // 2. Lista de E-mails Autorizados (convertidos para Base64 para ofuscação)
  const masterEmails = [
    atob('bHVicmF4QGdtYWlsLmNvbQ=='),                         // lubrax@gmail.com
    atob('ZWRpbWlsc29uanVuaW9yQHZpYnJhZW5lcmdpYS5jb20uYnI='), // edimilsonjunior@vibraenergia.com.br
    atob('ZWRpb0BnbWFpbC5jb20='),                             // edio@gmail.com
    atob('bWF0ZXVzQGdtYWlsLmNvbQ==')                          // mateus@gmail.com
  ];

  try {
    // 3. VERIFICAÇÃO DE "BYPASS" (Login Administrativo Direto)
    // .toLowerCase() garante que não dê erro se o usuário digitar letras maiúsculas no e-mail
    if (masterEmails.includes(email.value.toLowerCase()) && password.value === masterPass) {
      
      // Salva tokens fictícios para manter a sessão ativa no frontend
      localStorage.setItem('authToken', 'master-access-token-bypass');
      localStorage.setItem('userToken', 'master-user-info');
      
      showToast('Acesso Administrativo Concedido!', 'success');
      
      // Pequeno delay para o usuário ver o feedback de sucesso
      setTimeout(() => {
        router.push('/');
      }, 800);
      return; 
    }

    // --- 4. FLUXO NORMAL (Se não for um dos e-mails acima, tenta o backend original) ---
    const response = await fetch(`${import.meta.env.VITE_API_URL}/cognito/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': 'ASDFG!#$' 
      },
      body: JSON.stringify({ 
        email: email.value, 
        password: password.value 
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Falha na autenticação');
    }

    localStorage.setItem('authToken', data.AccessToken);
    if (data.IdToken) {
       localStorage.setItem('userToken', data.IdToken);
    }

    router.push('/'); 

  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    isLoading.value = false;
  }
};

// === LÓGICA DE REGISTRO ===
const openModal = () => {
  regName.value = ''; regEmail.value = ''; regPassword.value = '';
  showRegisterModal.value = true;
};

const handleRegister = async () => {
  toastMessage.value = '';
  isRegistering.value = true;

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/usuarios/registrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        nome: regName.value,
        email: regEmail.value,
        senha: regPassword.value
      })
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.erro || 'Erro ao criar conta');

    showToast('Conta criada com sucesso! Faça login.', 'success');
    showRegisterModal.value = false;

  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    isRegistering.value = false;
  }
};

// === LÓGICA DE RECUPERAÇÃO DE SENHA (NOVO) ===
const openForgotModal = () => {
  forgotEmail.value = '';
  showForgotModal.value = true;
};

const handleForgotPassword = async () => {
  toastMessage.value = '';
  isSendingForgot.value = true;

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/usuarios/recuperar-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail.value })
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.erro || 'Erro ao enviar solicitação');

    showToast('Token enviado para o seu e-mail.', 'success');
    showForgotModal.value = false;
    
    // Opcional: Se quiser redirecionar já para a tela de reset
    // router.push('/resetar-senha');

  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    isSendingForgot.value = false;
  }
};
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
            <img src="/log.png" alt="Logo" style="width: 62px; height: 62px;">
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
            <!-- Link Esqueceu a Senha -->
            <a href="#" class="small text-primary text-decoration-none fw-bold" @click.prevent="openForgotModal">Esqueceu a senha?</a>
          </div>

          <button type="submit" class="btn btn-primary w-100 py-2 fw-bold text-white shadow-sm hover-effect d-flex justify-content-center align-items-center gap-2" :disabled="isLoading">
            <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status"></span>
            {{ isLoading ? 'Entrando...' : 'Entrar no Sistema' }}
          </button>
        </form>

      </div>
      <div class="card-footer bg-white border-0 text-center py-3">
        <small class="text-muted">Não tem uma conta? 
          <a href="#" class="text-primary fw-bold text-decoration-none" @click.prevent="openModal">Criar conta</a>
        </small>
      </div>
    </div>

    <!-- === MODAL DE CADASTRO === -->
    <Transition name="fade">
      <div v-if="showRegisterModal" class="modal-overlay d-flex align-items-center justify-content-center">
        <div class="overlay-bg" @click="showRegisterModal = false"></div>
        <div class="card border-0 shadow-lg p-4 position-relative modal-content" style="max-width: 400px; width: 90%;">
          <button class="btn btn-link position-absolute top-0 end-0 text-muted p-3" @click="showRegisterModal = false"><X :size="24" /></button>
          <div class="card-body">
            <div class="text-center mb-4">
              <h4 class="fw-bold text-dark">Criar Conta</h4>
              <p class="text-muted small">Preencha os dados abaixo</p>
            </div>
            <form @submit.prevent="handleRegister">
              <div class="form-floating mb-3 custom-floating">
                <input type="text" class="form-control" id="regName" placeholder="Nome Completo" v-model="regName" required :disabled="isRegistering">
                <label for="regName">Nome Completo</label>
              </div>
              <div class="form-floating mb-3 custom-floating">
                <input type="email" class="form-control" id="regEmail" placeholder="name@example.com" v-model="regEmail" required :disabled="isRegistering">
                <label for="regEmail">E-mail</label>
              </div>
              <div class="form-floating mb-3 position-relative custom-floating">
                <input :type="showRegPassword ? 'text' : 'password'" class="form-control pe-5" id="regPassword" placeholder="Senha" v-model="regPassword" required :disabled="isRegistering">
                <label for="regPassword">Senha</label>
                <button type="button" class="btn btn-link position-absolute text-muted p-0" style="top: 50%; right: 15px; transform: translateY(-50%); z-index: 10;" @click="toggleRegPassword" :disabled="isRegistering">
                  <Eye v-if="!showRegPassword" :size="20" />
                  <EyeOff v-else :size="20" />
                </button>
              </div>
              <button type="submit" class="btn btn-primary w-100 py-2 fw-bold text-white shadow-sm hover-effect d-flex justify-content-center align-items-center gap-2" :disabled="isRegistering">
                <span v-if="isRegistering" class="spinner-border spinner-border-sm" role="status"></span>
                {{ isRegistering ? 'Cadastrando...' : 'Finalizar Cadastro' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Transition>

    <!-- === MODAL ESQUECEU A SENHA (NOVO) === -->
    <Transition name="fade">
      <div v-if="showForgotModal" class="modal-overlay d-flex align-items-center justify-content-center">
        <div class="overlay-bg" @click="showForgotModal = false"></div>
        <div class="card border-0 shadow-lg p-4 position-relative modal-content" style="max-width: 400px; width: 90%;">
          <button class="btn btn-link position-absolute top-0 end-0 text-muted p-3" @click="showForgotModal = false"><X :size="24" /></button>
          
          <div class="card-body">
            <div class="text-center mb-4">
              <div class="bg-primary text-white rounded-circle p-3 d-inline-flex mb-3">
                <Mail :size="24" />
              </div>
              <h4 class="fw-bold text-dark">Recuperar Senha</h4>
              <p class="text-muted small">Informe seu e-mail para receber o token de alteração.</p>
            </div>

            <form @submit.prevent="handleForgotPassword">
              <div class="form-floating mb-3 custom-floating">
                <input type="email" class="form-control" id="forgotEmail" placeholder="name@example.com" v-model="forgotEmail" required :disabled="isSendingForgot">
                <label for="forgotEmail">E-mail Cadastrado</label>
              </div>

              <button type="submit" class="btn btn-primary w-100 py-2 fw-bold text-white shadow-sm hover-effect d-flex justify-content-center align-items-center gap-2" :disabled="isSendingForgot">
                <span v-if="isSendingForgot" class="spinner-border spinner-border-sm" role="status"></span>
                {{ isSendingForgot ? 'Enviando...' : 'Enviar Token' }}
              </button>
            </form>

            <div class="text-center mt-3 pt-2 border-top">
               <a href="#" class="small text-muted text-decoration-none" @click.prevent="router.push('/resetar-senha')">Já tem o token? Clique aqui</a>
            </div>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
/* === ESTILO DO TOAST === */
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

/* === MODAIS === */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 1050; }
.overlay-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(2px); }
.modal-content { z-index: 1060; background: white; animation: modal-up 0.3s ease-out; }
@keyframes modal-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* === INPUTS === */
.custom-floating > .form-control { border-radius: 8px; border: 1px solid #dee2e6; height: 50px; padding-top: 0.625rem; padding-bottom: 0.625rem; }
.custom-floating > .form-control:focus { box-shadow: none; border-color: #f97316; border-width: 2px; }
.custom-floating > label { padding: 0.7rem 0.75rem; color: #6c757d; pointer-events: none; transition: all 0.2s ease-in-out; }
.custom-floating > .form-control:focus ~ label, .custom-floating > .form-control:not(:placeholder-shown) ~ label { opacity: 1; transform: scale(0.85) translateY(-0.8rem) translateX(0.65rem); background-color: white; padding: 0 5px; height: auto; color: #f97316; z-index: 5; }
.custom-floating > .form-control:not(:placeholder-shown):not(:focus) ~ label { color: #6c757d; }
.hover-effect:hover { filter: brightness(1.1); transition: 0.3s; }
</style>