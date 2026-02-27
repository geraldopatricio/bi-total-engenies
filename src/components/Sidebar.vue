<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { chatState } from '../chatState';

// IMPORTAR O JSON LOCAL
import menusLocal from '../data/menu/menus.json';

import { 
  LayoutDashboard, UploadCloud, ChevronDown, Circle,
  Edit, Blocks, MessageSquare, HelpCircle, LogOut, Users, MessageCircle, 
  Settings, PenTool, BarChart 
} from 'lucide-vue-next';

const iconMap = {
  LayoutDashboard,
  UploadCloud,
  Edit,
  Blocks,
  MessageSquare,
  MessageCircle,
  Users,
  Settings,
  PenTool,
  BarChart,
  HelpCircle,
  LogOut
};

const router = useRouter();
const route = useRoute();
const menuItems = ref([]); 
const expandedMenu = ref(null);

const navigateTo = (path) => {
  if (path) router.push(path);
};

const toggleMenu = (menuId) => {
  expandedMenu.value = expandedMenu.value === menuId ? null : menuId;
};

const handleLogout = () => {
  if (chatState.socket) {
    chatState.socket.disconnect();
    chatState.socket = null;
  }
  chatState.onlineUsers = [];
  chatState.unreadMessages = false;
  localStorage.removeItem('authToken');
  router.push('/login');
};

// 2. ALTERADO: Agora carrega do arquivo local em vez do fetch
const fetchMenus = () => {
  // Simplesmente atribui o JSON importado ao valor reativo
  menuItems.value = menusLocal;
};

watch(route, (newRoute) => {
  menuItems.value.forEach(item => {
    if (item.submenus && item.submenus.length > 0) {
      const temFilhoAtivo = item.submenus.some(sub => sub.rota === newRoute.path);
      if (temFilhoAtivo) {
        expandedMenu.value = item.id;
      }
    }
  });
}, { immediate: true });

onMounted(() => {
  fetchMenus();
});
</script>

<template>
  <!-- O TEMPLATE PERMANECE EXATAMENTE O MESMO QUE VOCÊ JÁ TEM -->
  <nav class="d-flex flex-column p-3 h-100">
    <div class="d-flex align-items-center mb-4 px-2 mt-2">
      <div class="p-1 d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px; font-weight: bold;">
        <img src="/log.png" alt="Logo" style="width: 32px; height: 32px;">
      </div>
      <img src="/lu.png" alt="Logo" style="width: 150px; height: 20px;">
    </div>

    <div class="flex-grow-1 overflow-auto hide-scrollbar">
      <small class="text-uppercase text-muted fw-bold ps-2" style="font-size: 0.75rem;">Menu</small>
      
      <ul class="nav flex-column mt-2 gap-1">
        <li v-for="item in menuItems" :key="item.id" 
            :class="{ 'mt-4 mb-2 ps-2': item.tipo === 'separador', 'nav-item': item.tipo !== 'separador' }">
          
          <small v-if="item.tipo === 'separador'" class="text-uppercase text-muted fw-bold" style="font-size: 0.75rem;">
            {{ item.titulo }}
          </small>

          <template v-else-if="item.tipo === 'grupo'">
            <a href="#" class="nav-link d-flex justify-content-between align-items-center"
              :class="{ 'text-dark bg-light': expandedMenu === item.id }"
              @click.prevent="toggleMenu(item.id)">
              <div class="d-flex align-items-center gap-2">
                <component :is="iconMap[item.icone]" :size="20" v-if="item.icone" />
                <span>{{ item.titulo }}</span>
              </div>
              <ChevronDown :size="16" class="transition-transform" :class="{ 'rotate-180': expandedMenu === item.id }" />
            </a>

            <div v-show="expandedMenu === item.id" class="mt-1 ps-3">
              <ul class="nav flex-column gap-1 border-start ms-2 ps-2">
                <li v-for="sub in item.submenus" :key="sub.id" class="nav-item">
                  <a href="#" class="nav-link py-2" :class="{ 'active shadow-sm': route.path === sub.rota }" @click.prevent="navigateTo(sub.rota)">
                    <Circle :size="8" :class="{ 'fill-current': route.path === sub.rota }" /> 
                    {{ sub.titulo }}
                  </a>
                </li>
              </ul>
            </div>
          </template>

          <template v-else-if="item.tipo === 'link'">
            <a href="#" class="nav-link d-flex justify-content-between align-items-center" :class="{ 'active': route.path === item.rota }" @click.prevent="navigateTo(item.rota)">
              <div class="d-flex align-items-center">
                <component :is="iconMap[item.icone]" :size="20" class="me-2" v-if="item.icone" />
                {{ item.titulo }}
              </div>
              <div v-if="item.rota === '/lubchat' && chatState.unreadMessages" class="blinking-dot"></div>
            </a>
          </template>
        </li>
      </ul>
    </div>

    <div class="mt-auto border-top pt-3">
      <a href="#" class="nav-link mb-1"><HelpCircle :size="20" /> Ajuda</a>
      <a href="#" class="nav-link text-danger bg-red-subtle" @click.prevent="handleLogout"><LogOut :size="20" /> Sair</a>
    </div>
  </nav>
</template>

<style scoped>
/* SEUS ESTILOS PERMANECEM IGUAIS */
.transition-transform { transition: transform 0.2s ease; }
.rotate-180 { transform: rotate(180deg); }
.hide-scrollbar::-webkit-scrollbar { width: 4px; }
.hide-scrollbar::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 4px; }
.fill-current { fill: currentColor; }
.blinking-dot { width: 10px; height: 10px; background-color: #ef4444; border-radius: 50%; margin-right: 10px; animation: blink 1.5s infinite; }
@keyframes blink { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } 100% { opacity: 1; transform: scale(1); } }
</style>