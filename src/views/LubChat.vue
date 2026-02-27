<script setup>
import { ref, onMounted, nextTick, computed, watch } from 'vue';
import { chatState } from '../chatState'; // Importa Estado Global
import { Send, Search, MoreVertical, Paperclip, MessageSquare } from 'lucide-vue-next';

// Estados Locais
const currentUser = ref(null);
const selectedUser = ref(null);
const messageInput = ref('');
const messages = ref([]); 
const chatContainer = ref(null);
const userSearch = ref('');

// Pega lista de usuários do estado global (reativo)
const onlineUsers = computed(() => chatState.onlineUsers);

const getCurrentUser = () => {
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
        return { id: String(payload.id), nome: payload.nome || payload.email, email: payload.email };
        } catch (e) { return null; }
    }
    return null;
};

// Função para configurar os eventos nesta tela
const setupChatListeners = () => {
  if (chatState.socket) {
    // Remove listeners antigos para evitar duplicação
    chatState.socket.off('history_response');
    chatState.socket.off('private_message_chat_screen'); // Usa namespace personalizado se possível, ou gerencia manualmente

    // Recebe histórico
    chatState.socket.on('history_response', (history) => {
      messages.value = history;
      scrollToBottom();
    });

    // Recebe mensagem nova (para atualizar a tela se estiver com o chat aberto)
    // Nota: O App.vue já escuta 'private_message' para o alerta, aqui escutamos para mostrar o texto.
    // Como é o mesmo evento, ambos disparam.
    chatState.socket.on('private_message', (msg) => {
      if (selectedUser.value) {
        const incomingFromId = String(msg.fromId);
        const incomingToId = String(msg.toId);
        const myId = currentUser.value.id;
        const selectedId = String(selectedUser.value.id);

        // Se a mensagem pertence à conversa aberta
        if (
            (incomingFromId === selectedId && incomingToId === myId) || 
            (incomingFromId === myId && incomingToId === selectedId)
        ) {
          messages.value.push(msg);
          scrollToBottom();
        }
      }
    });
  }
};

onMounted(() => {
  currentUser.value = getCurrentUser();
  chatState.unreadMessages = false; // Limpa alerta ao entrar

  // Tenta configurar listeners. Se o socket ainda não estiver pronto (App.vue lento), espera.
  if (chatState.socket) {
    setupChatListeners();
  } else {
    // Watcher de segurança caso o socket demore a conectar
    const unwatch = watch(() => chatState.socket, (newSocket) => {
      if (newSocket) {
        setupChatListeners();
        unwatch();
      }
    });
  }
});

const selectUser = (user) => {
  selectedUser.value = user;
  messages.value = [];
  if (chatState.socket) {
    chatState.socket.emit('request_history', String(user.id));
  }
};

const sendMessage = () => {
  if (!messageInput.value.trim() || !selectedUser.value) return;

  const msgPayload = {
    text: messageInput.value,
    fromId: String(currentUser.value.id),
    toId: String(selectedUser.value.id),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  if (chatState.socket) {
    chatState.socket.emit('send_private_message', msgPayload);
    messages.value.push(msgPayload); // Optimistic UI
    messageInput.value = '';
    scrollToBottom();
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

const filteredUsers = computed(() => {
  if (!userSearch.value) return onlineUsers.value;
  return onlineUsers.value.filter(u => u.nome.toLowerCase().includes(userSearch.value.toLowerCase()));
});
</script>

<template>
  <div class="container-fluid p-0 h-100 d-flex flex-column" style="height: calc(100vh - 80px) !important;">
    
    <div class="row g-0 h-100 flex-grow-1 border-top">
      
      <!-- COLUNA ESQUERDA: LISTA -->
      <div class="col-lg-3 col-md-4 border-end bg-white d-flex flex-column">
        <div class="p-3 border-bottom bg-light">
          <h5 class="fw-bold mb-3">LubChat</h5>
          <div class="input-group">
            <span class="input-group-text bg-white border-end-0"><Search :size="16" class="text-muted"/></span>
            <input type="text" class="form-control border-start-0 ps-0" placeholder="Buscar usuário..." v-model="userSearch">
          </div>
        </div>

        <div class="flex-grow-1 overflow-auto custom-scroll">
          <div v-if="filteredUsers.length === 0" class="text-center p-4 text-muted small">
            Nenhum outro usuário online no momento.
          </div>

          <div 
            v-for="user in filteredUsers" 
            :key="user.id"
            class="d-flex align-items-center p-3 border-bottom cursor-pointer hover-bg"
            :class="{ 'bg-orange-subtle': selectedUser?.id === user.id }"
            @click="selectUser(user)"
          >
            <div class="position-relative me-3">
              <div class="avatar-circle d-flex align-items-center justify-content-center bg-secondary text-white fw-bold">
                {{ user.nome.charAt(0).toUpperCase() }}
              </div>
              <span class="position-absolute bottom-0 start-100 translate-middle p-1 bg-success border border-light rounded-circle"></span>
            </div>
            <div class="flex-grow-1 overflow-hidden">
              <div class="d-flex justify-content-between align-items-center">
                <h6 class="mb-0 text-truncate fw-bold text-dark" style="font-size: 0.9rem;">{{ user.nome }}</h6>
                <small class="text-muted" style="font-size: 0.7rem;">Online</small>
              </div>
              <small class="text-muted text-truncate d-block" style="font-size: 0.8rem;">Clique para iniciar conversa</small>
            </div>
          </div>
        </div>
      </div>

      <!-- COLUNA DIREITA: ÁREA DE CHAT -->
      <div class="col-lg-9 col-md-8 bg-light d-flex flex-column">
        
        <div v-if="!selectedUser" class="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
          <div class="bg-white p-4 rounded-circle shadow-sm mb-3">
            <MessageSquare :size="48" class="text-primary" />
          </div>
          <h5>Bem-vindo ao LubChat</h5>
          <p class="small">Selecione um usuário na lista ao lado para iniciar um bate-papo.</p>
        </div>

        <template v-else>
          <div class="p-3 bg-white border-bottom d-flex justify-content-between align-items-center shadow-sm z-10">
            <div class="d-flex align-items-center gap-3">
              <div class="avatar-circle d-flex align-items-center justify-content-center bg-primary text-white fw-bold">
                {{ selectedUser.nome.charAt(0).toUpperCase() }}
              </div>
              <div>
                <h6 class="m-0 fw-bold">{{ selectedUser.nome }}</h6>
                <small class="text-success fw-bold d-flex align-items-center gap-1">
                  <span class="d-inline-block rounded-circle bg-success" style="width: 6px; height: 6px;"></span> Online
                </small>
              </div>
            </div>
            <button class="btn btn-icon"><MoreVertical :size="20" class="text-muted" /></button>
          </div>

          <div class="flex-grow-1 overflow-auto p-4 custom-scroll" ref="chatContainer">
            <div v-if="messages.length === 0" class="text-center mt-5">
              <span class="badge bg-white text-muted border shadow-sm py-2 px-3 fw-normal">Início da conversa com {{ selectedUser.nome }}</span>
            </div>

            <div 
              v-for="(msg, index) in messages" 
              :key="index"
              class="d-flex mb-3"
              :class="String(msg.fromId) === currentUser.id ? 'justify-content-end' : 'justify-content-start'"
            >
              <div 
                class="p-3 rounded-3 shadow-sm position-relative"
                :class="String(msg.fromId) === currentUser.id ? 'bg-primary text-white rounded-br-0' : 'bg-white text-dark rounded-bl-0'"
                style="max-width: 70%;"
              >
                <p class="m-0 mb-1" style="font-size: 0.95rem;">{{ msg.text }}</p>
                <div class="d-flex justify-content-end">
                   <small :class="String(msg.fromId) === currentUser.id ? 'text-white-50' : 'text-muted'" style="font-size: 0.7rem;">{{ msg.timestamp }}</small>
                </div>
              </div>
            </div>
          </div>

          <div class="p-3 bg-white border-top">
            <form @submit.prevent="sendMessage" class="d-flex gap-2 align-items-center">
              <button type="button" class="btn btn-light border btn-icon rounded-circle"><Paperclip :size="20" class="text-muted" /></button>
              <input 
                type="text" 
                class="form-control bg-light border-0 py-2" 
                placeholder="Digite sua mensagem..." 
                v-model="messageInput"
              >
              <button type="submit" class="btn btn-primary rounded-circle btn-icon shadow-sm">
                <Send :size="20" />
              </button>
            </form>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scroll::-webkit-scrollbar { width: 6px; }
.custom-scroll::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 3px; }
.avatar-circle { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
.hover-bg:hover { background-color: #f8f9fa; }
.cursor-pointer { cursor: pointer; }
.rounded-br-0 { border-bottom-right-radius: 0 !important; }
.rounded-bl-0 { border-bottom-left-radius: 0 !important; }
.btn-icon { width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; }
.bg-orange-subtle { background-color: #ffedd5 !important; }
</style>