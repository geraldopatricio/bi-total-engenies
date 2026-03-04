import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Login from '../views/Login.vue'

// Importar as novas telas

// NOVOS CADASTROS
import Usuarios from '../views/cadastros/Usuarios.vue'; 
import Acesso from '../views/cadastros/Acesso.vue'; 
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
    // Rotas de Importação
    
    // NOVAS ROTAS DE CADASTRO (CRUD)
    { path: '/cadastros/usuarios', name: 'usuarios', component: Usuarios, meta: { requiresLayout: true } }, 
    { path: '/cadastros/acesso', name: 'acesso', component: Acesso, meta: { requiresLayout: true } }, 
    { path: '/lubchat', name: 'lubchat', component: LubChat, meta: { requiresLayout: true } }

  ]
})


router.beforeEach((to, from, next) => {
  // Verifica se a rota precisa de layout (geralmente usamos isso para saber se é protegida)
  // Ou você pode verificar se o nome da rota NÃO é 'login'
  const isPublic = to.name === 'login';
  const isAuthenticated = localStorage.getItem('authToken'); // Verifica se tem token

  if (!isPublic && !isAuthenticated) {
    // Se não for pública e não tiver token, manda pro login
    next({ name: 'login' });
  } else if (isPublic && isAuthenticated) {
    // Se tentar ir pro login mas já tiver token, manda pro dashboard
    next({ name: 'dashboard' }); // ou '/'
  } else {
    // Segue normal
    next();
  }
});

export default router
