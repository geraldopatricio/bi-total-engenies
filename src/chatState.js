import { reactive } from 'vue';

export const chatState = reactive({
  socket: null,        // A conexão ativa
  onlineUsers: [],     // Lista de quem está online
  unreadMessages: false // Se tem mensagem não lida (para piscar o alerta)
});