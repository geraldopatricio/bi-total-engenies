import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Login from '../views/Login.vue'

// Importar as novas telas
import Usuarios from '../views/cadastros/Usuarios.vue'; 
import Acesso from '../views/cadastros/Acesso.vue';  // Certifique-se que o arquivo está em views/cadastros/Acesso.vue
import ResetPassword from '../views/ResetPassword.vue'; 
import LubChat from '../views/LubChat.vue';
import MenusPage from '../views/configuracoes/MenusPage.vue'; 

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard,
      meta: { requiresLayout: true }
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { requiresLayout: false }
    },
    { 
      path: '/resetar-senha', 
      name: 'reset-password', 
      component: ResetPassword, 
      meta: { requiresLayout: false } 
    },
    { 
      path: '/configuracoes/menus', 
      name: 'menus', 
      component: MenusPage, 
      meta: { requiresLayout: true } 
    },
    
    // NOVAS ROTAS DE CADASTRO (CRUD)
    { 
      path: '/cadastros/usuarios', 
      name: 'usuarios', 
      component: Usuarios, 
      meta: { requiresLayout: true } 
    }, 
    { 
      path: '/cadastros/acesso', 
      name: 'acesso', 
      component: Acesso, 
      meta: { requiresLayout: true } 
    }, // Corrigido de () para {}
    { 
      path: '/lubchat', 
      name: 'lubchat', 
      component: LubChat, 
      meta: { requiresLayout: true } 
    }
  ]
})

// Guard de navegação
router.beforeEach((to, from, next) => {
  const isPublic = to.name === 'login' || to.name === 'reset-password';
  const isAuthenticated = localStorage.getItem('authToken');

  if (!isPublic && !isAuthenticated) {
    next({ name: 'login' });
  } else if (isPublic && isAuthenticated) {
    next({ name: 'dashboard' });
  } else {
    next();
  }
});

export default router
