<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { io } from 'socket.io-client';
import { chatState } from './chatState'; 

import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'

const route = useRoute();
const isSidebarOpen = ref(false);

const toggleSidebar = () => isSidebarOpen.value = !isSidebarOpen.value;
const closeSidebar = () => isSidebarOpen.value = false;

// --- LÓGICA DE CONEXÃO DO CHAT ---
const connectChat = () => {
  const token = localStorage.getItem('authToken');
  
  // Se tem token E (não tem socket OU o socket está desconectado)
  if (token && (!chatState.socket || !chatState.socket.connected)) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
      
      const myId = String(payload.id);

      // Se já existia uma instância antiga, garanta que está limpa
      if (chatState.socket) {
        chatState.socket.disconnect();
        chatState.socket.removeAllListeners();
      }

      // Conecta
      chatState.socket = io(import.meta.env.VITE_SOCKET_URL, {
        query: {
          userId: myId,
          userName: payload.nome || payload.email
        },
        // Força nova conexão limpa
        forceNew: true,
        reconnection: true
      });

      // Listeners Globais
      chatState.socket.on('connect', () => {
        console.log("Chat Conectado com ID:", myId);
      });

      chatState.socket.on('users_update', (users) => {
        // Filtra eu mesmo da lista
        chatState.onlineUsers = users
          .filter(u => String(u.id) !== myId)
          .map(u => ({...u, id: String(u.id)}));
      });

      chatState.socket.on('private_message', (msg) => {
        if (route.path !== '/lubchat') {
          chatState.unreadMessages = true;
        }
      });

    } catch (e) {
      console.error("Erro ao iniciar chat:", e);
    }
  }
};

// 1. Tenta conectar ao carregar a página (F5)
onMounted(() => {
  connectChat();
});

// 2. VIGIA AS ROTAS (Correção do Bug de Troca de Usuário)
// Toda vez que mudar de página, verifica se precisa conectar ou desconectar
watch(() => route.path, (newPath) => {
  const token = localStorage.getItem('authToken');

  // Se estou numa rota protegida (tem token) e o chat está off, CONECTA
  if (token && (!chatState.socket || !chatState.socket.connected)) {
    connectChat();
  }

  // Se fui para o Login (não tem token), DESCONECTA e LIMPA
  if (!token && chatState.socket) {
    chatState.socket.disconnect();
    chatState.socket = null;
    chatState.onlineUsers = [];
  }

  // Lógica da bolinha vermelha
  if (newPath === '/lubchat') {
    chatState.unreadMessages = false;
  }
});
</script>

<template>
  <div v-if="!route.meta.requiresLayout">
    <router-view />
  </div>

  <div v-else class="wrapper">
    <div class="sidebar-overlay" :class="{ active: isSidebarOpen }" @click="closeSidebar"></div>
    <div id="sidebar" :class="{ active: isSidebarOpen }"><Sidebar /></div>
    <div id="content">
      <Navbar @toggle-sidebar="toggleSidebar" />
      <main class="flex-grow-1"><router-view /></main>
      <Footer />
    </div>
  </div>
</template>