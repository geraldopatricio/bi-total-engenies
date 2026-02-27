<script setup>
import { ref, nextTick, watch } from 'vue';
import { MessageCircle, X, Send, User, ChevronRight, ExternalLink } from 'lucide-vue-next';

// --- ESTADOS DO CHAT ---
const isOpen = ref(false);
const inputValue = ref('');
const userName = ref('');
const step = ref('ASK_NAME'); // Estados: ASK_NAME, SHOW_MENU, SHOW_LINK
const messages = ref([]);
const chatBody = ref(null);

// --- IDENTIDADE VISUAL ---
const primaryColor = '#f97316'; // Laranja LubConsulta

// --- LÓGICA DE MENSAGENS ---
const addMessage = (text, isUser = false, type = 'text', options = null) => {
  messages.value.push({
    id: Date.now(),
    text,
    isUser,
    type, // 'text', 'menu', 'link'
    options
  });
  scrollToBottom();
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatBody.value) chatBody.value.scrollTop = chatBody.value.scrollHeight;
  });
};

// --- AÇÕES DO CHAT ---
const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value && messages.value.length === 0) {
    // Primeira abertura: Saudação
    setTimeout(() => {
      addMessage('Olá, qual o seu nome?');
    }, 300);
  }
};

const handleSend = () => {
  if (!inputValue.value.trim()) return;
  const text = inputValue.value.trim();
  
  // 1. Adiciona mensagem do usuário
  addMessage(text, true);
  inputValue.value = '';

  // 2. Lógica baseada no passo atual
  if (step.value === 'ASK_NAME') {
    userName.value = text;
    setTimeout(() => {
      step.value = 'SHOW_MENU';
      addMessage(`Olá ${userName.value}, como posso lhe ajudar?`, false);
      addMessage('Escolha uma das opções abaixo:', false, 'menu', [
        { id: 1, label: 'Adquirir um Plano' },
        { id: 2, label: 'Suporte LubConsulta' },
        { id: 3, label: 'Falar com atendente humanizado' }
      ]);
    }, 600);
  }
};

const handleOptionClick = (optionId) => {
  // Adiciona a escolha do usuário visualmente
  const labels = {
    1: '1 - Adquirir um Plano',
    2: '2 - Suporte LubConsulta',
    3: '3 - Falar com atendente'
  };
  addMessage(labels[optionId], true);

  setTimeout(() => {
    if (optionId === 1) {
      addMessage('Para escolher um Plano, clique no link abaixo:', false, 'link', {
        url: 'https://planos.lubconsulta.com.br',
        label: 'Acessar planos.lubconsulta.com.br'
      });
      step.value = 'SHOW_LINK'; // Aguarda usuário clicar ou reiniciar
    } 
    else if (optionId === 2) {
      addMessage('Para acessar o sistema, clique no link abaixo:', false, 'link', {
        url: 'https://app.lubconsulta.com.br',
        label: 'Acessar app.lubconsulta.com.br'
      });
      step.value = 'SHOW_LINK';
    } 
    else if (optionId === 3) {
      // Redireciona WhatsApp e Reseta
      window.open('https://wa.me/5585999009531', '_blank');
      resetChat();
    }
  }, 500);
};

const resetChat = () => {
  step.value = 'ASK_NAME';
  userName.value = '';
  messages.value = [];
  // Fecha e reabre limpo ou mostra mensagem de reinício
  addMessage('Chat reiniciado. O que deseja fazer agora? (Digite seu nome novamente para começar)', false);
};

</script>

<template>
  <!-- FOOTER ORIGINAL -->
  <footer class="p-4 text-center text-muted small border-top mt-auto bg-white position-relative">
    &copy; 2025 LubConsulta - Todos os direitos reservados.
    
    <!-- === BOTÃO FLUTUANTE (CHAT TRIGGER) === -->
    <div class="chat-trigger-container" @click="toggleChat">
      <div class="pulse-ring"></div>
      <button class="btn-chat-float shadow-lg">
        <X v-if="isOpen" size="28" color="white" />
        <MessageCircle v-else size="28" color="white" fill="white" />
      </button>
    </div>

    <!-- === JANELA DO CHAT === -->
    <transition name="slide-up">
      <div v-if="isOpen" class="chat-window shadow-lg">
        
        <!-- HEADER -->
        <div class="chat-header d-flex align-items-center justify-content-between p-3 text-white">
          <div class="d-flex align-items-center gap-2">
            <div class="avatar bg-white text-orange rounded-circle d-flex align-items-center justify-content-center">
              <User size="16" :color="primaryColor" />
            </div>
            <div class="d-flex flex-column text-start">
              <span class="fw-bold" style="font-size: 0.9rem;">Atendente Virtual</span>
              <small style="font-size: 0.7rem; opacity: 0.9;">Online agora</small>
            </div>
          </div>
          <button @click="toggleChat" class="btn btn-sm text-white p-0"><X size="20"/></button>
        </div>

        <!-- BODY (MENSAGENS) -->
        <div class="chat-body p-3" ref="chatBody">
          <div v-for="msg in messages" :key="msg.id" class="mb-3 d-flex flex-column" :class="msg.isUser ? 'align-items-end' : 'align-items-start'">
            
            <!-- Balão de Texto -->
            <div class="message-bubble p-2 px-3 shadow-sm" 
                 :class="msg.isUser ? 'user-msg text-white' : 'bot-msg text-dark bg-light'">
              {{ msg.text }}
            </div>

            <!-- Opções de Menu (Se houver) -->
            <div v-if="msg.type === 'menu'" class="mt-2 d-flex flex-column gap-2 w-75">
              <button v-for="opt in msg.options" :key="opt.id" 
                      @click="handleOptionClick(opt.id)"
                      class="btn btn-sm btn-outline-primary text-start d-flex align-items-center justify-content-between bg-white">
                {{ opt.id }} - {{ opt.label }}
                <ChevronRight size="14" />
              </button>
            </div>

            <!-- Link (Se houver) -->
            <div v-if="msg.type === 'link'" class="mt-2">
              <a :href="msg.options.url" target="_blank" class="btn btn-sm btn-primary text-white d-flex align-items-center gap-2" @click="resetChat">
                <ExternalLink size="14" /> {{ msg.options.label }}
              </a>
            </div>

          </div>
        </div>

        <!-- FOOTER (INPUT) -->
        <div class="chat-footer p-2 border-top bg-white d-flex gap-2">
          <input 
            v-model="inputValue" 
            @keyup.enter="handleSend"
            :disabled="step === 'SHOW_MENU' || step === 'SHOW_LINK'"
            type="text" 
            class="form-control form-control-sm border-0 bg-light" 
            :placeholder="step === 'ASK_NAME' ? 'Digite seu nome...' : 'Escolha uma opção acima...'"
          >
          <button @click="handleSend" :disabled="!inputValue" class="btn btn-sm btn-primary d-flex align-items-center justify-content-center" style="width: 40px;">
            <Send size="16" />
          </button>
        </div>

      </div>
    </transition>

  </footer>
</template>

<style scoped>
/* Variáveis de cor locais */
.text-orange { color: #f97316; }

/* === BOTÃO FLUTUANTE === */
.chat-trigger-container {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 9999;
  cursor: pointer;
}

.btn-chat-float {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #f97316; /* Laranja da identidade */
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  transition: transform 0.3s ease;
  
  /* Animação de Flutuação */
  animation: float 3s ease-in-out infinite;
}

.btn-chat-float:hover {
  transform: scale(1.1);
}

/* Anel de Pulso (Efeito visual atrás do botão) */
.pulse-ring {
  position: absolute;
  top: 0; left: 0;
  width: 60px; height: 60px;
  border-radius: 50%;
  background-color: rgba(249, 115, 22, 0.6);
  z-index: 1;
  animation: pulse 2s infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.5); opacity: 0; }
}

/* === JANELA DO CHAT === */
.chat-window {
  position: fixed;
  bottom: 100px;
  right: 30px;
  width: 320px;
  height: 450px;
  background-color: #fff;
  border-radius: 12px;
  z-index: 9998;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.chat-header {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}

.avatar { width: 30px; height: 30px; }

.chat-body {
  flex-grow: 1;
  overflow-y: auto;
  background-color: #f8fafc;
  scroll-behavior: smooth;
}

/* Estilo das Mensagens */
.message-bubble {
  max-width: 85%;
  border-radius: 12px;
  font-size: 0.85rem;
  line-height: 1.4;
  position: relative;
}

.bot-msg {
  border-bottom-left-radius: 2px;
  border: 1px solid #e2e8f0;
}

.user-msg {
  background-color: #f97316;
  border-bottom-right-radius: 2px;
}

/* Transição de Entrada (Slide Up) */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>