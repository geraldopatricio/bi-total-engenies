<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { 
  Search, Plus, Edit2, CheckCircle, AlertTriangle, X, User, Lock, Mail, 
  Activity, Trash2, Eye, EyeOff, Phone, RefreshCw, 
  ArrowUpDown, ArrowUp, ArrowDown, Shield, UserCheck, UserX
} from 'lucide-vue-next';

// Importação da "base de dados" inicial
import usuariosIniciais from '@/data/acesso.json';

// === ESTADOS ===
const users = ref([]);
const searchQuery = ref('');
const isLoading = ref(false);
const isSaving = ref(false);
const showFormPassword = ref(false);

// === ORDENAÇÃO E PAGINAÇÃO ===
const sortKey = ref('id'); 
const sortOrder = ref('desc'); 
const currentPage = ref(1);
const itemsPerPage = 10;

// === ESTADOS DE MODAIS ===
const showModal = ref(false);
const showDetailsModal = ref(false);
const isEditing = ref(false);
const selectedUser = ref(null);

const form = ref({
  id: null,
  nome: '',
  email: '',
  senha: '',
  telefone: '',
  tipo: 'usuario',
  status: 'ativo'
});

const toast = ref({ show: false, msg: '', type: 'success' });

// === LÓGICA DE CARREGAMENTO ===
const fetchUsers = () => {
  isLoading.value = true;
  // Simula carregamento do JSON ou LocalStorage para manter dados ao dar F5
  const savedData = localStorage.getItem('usuarios_db');
  if (savedData) {
    users.value = JSON.parse(savedData);
  } else {
    users.value = usuariosIniciais;
  }
  setTimeout(() => { isLoading.value = false; }, 500);
};

const saveToLocalStorage = () => {
  localStorage.setItem('usuarios_db', JSON.stringify(users.value));
};

// === FILTRAGEM E ORDENAÇÃO ===
const sortedAndFilteredUsers = computed(() => {
  const term = searchQuery.value.toLowerCase();
  
  let filtered = users.value.filter(u => {
    return (
      u.nome.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.telefone.toLowerCase().includes(term) ||
      u.tipo.toLowerCase().includes(term)
    );
  });

  return filtered.sort((a, b) => {
    let modifier = sortOrder.value === 'asc' ? 1 : -1;
    let valA = a[sortKey.value];
    let valB = b[sortKey.value];
    if (valA < valB) return -1 * modifier;
    if (valA > valB) return 1 * modifier;
    return 0;
  });
});

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return sortedAndFilteredUsers.value.slice(start, start + itemsPerPage);
});

const totalPages = computed(() => Math.ceil(sortedAndFilteredUsers.value.length / itemsPerPage) || 1);

const handleSort = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};

// === AÇÕES DO CRUD ===
const showToast = (msg, type = 'success') => {
  toast.value = { show: true, msg, type };
  setTimeout(() => toast.value.show = false, 3000);
};

const openModalCreate = () => {
  isEditing.value = false;
  form.value = { id: Date.now(), nome: '', email: '', senha: '', telefone: '', tipo: 'usuario', status: 'ativo' };
  showModal.value = true;
};

const openModalEdit = (user) => {
  isEditing.value = true;
  form.value = { ...user };
  showModal.value = true;
};

const handleSave = () => {
  isSaving.value = true;
  
  setTimeout(() => {
    if (isEditing.value) {
      const index = users.value.findIndex(u => u.id === form.value.id);
      users.value[index] = { ...form.value };
      showToast('Usuário atualizado com sucesso!');
    } else {
      users.value.push({ ...form.value });
      showToast('Usuário cadastrado com sucesso!');
    }
    saveToLocalStorage();
    showModal.value = false;
    isSaving.value = false;
  }, 500);
};

const toggleStatus = (user) => {
  const newStatus = user.status === 'ativo' ? 'inativo' : 'ativo';
  user.status = newStatus;
  saveToLocalStorage();
  showToast(`Usuário ${newStatus === 'ativo' ? 'ativado' : 'desativado'}!`);
};

const confirmDelete = (user) => {
  if (confirm(`Deseja realmente excluir o usuário ${user.nome}?`)) {
    users.value = users.value.filter(u => u.id !== user.id);
    saveToLocalStorage();
    showToast('Usuário removido!', 'error');
  }
};

onMounted(() => fetchUsers());
</script>

<template>
  <div class="container-fluid p-4 bg-light min-vh-100">
    
    <!-- TOAST -->
    <Transition name="toast">
      <div v-if="toast.show" :class="['custom-toast', toast.type === 'success' ? 'bg-success' : 'bg-danger']">
        <component :is="toast.type === 'success' ? CheckCircle : AlertTriangle" :size="20" class="me-2" />
        <span>{{ toast.msg }}</span>
      </div>
    </Transition>

    <!-- HEADER -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold text-dark m-0">GESTÃO DE ACESSOS</h4>
        <small class="text-muted text-uppercase">Controle de Usuários Internos</small>
      </div>
      <button class="btn btn-primary d-flex align-items-center gap-2 fw-bold text-white shadow-sm px-4" @click="openModalCreate">
        <Plus :size="18" /> Novo Usuário
      </button>
    </div>

    <!-- TABELA -->
    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        
        <!-- TOOLBAR -->
        <div class="p-3 border-bottom bg-white d-flex align-items-center gap-3">
          <div class="input-group" style="max-width: 400px;">
            <span class="input-group-text bg-light border-end-0"><Search :size="16" class="text-muted"/></span>
            <input type="text" class="form-control border-start-0 ps-0" placeholder="Buscar por nome, e-mail ou tipo..." v-model="searchQuery">
          </div>
          <div class="ms-auto d-flex align-items-center gap-2">
             <button class="btn btn-sm btn-outline-secondary" @click="fetchUsers" :disabled="isLoading">
               <RefreshCw :size="14" :class="{ 'rotate': isLoading }" class="me-1"/> Sincronizar
             </button>
             <span class="text-muted small fw-bold">{{ sortedAndFilteredUsers.length }} registros</span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-orange-subtle text-primary small text-uppercase">
              <tr>
                <th class="py-3 px-4 border-0 sortable" @click="handleSort('nome')">
                  Usuário <component :is="sortKey === 'nome' ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown" :size="14" />
                </th>
                <th class="py-3 px-3 border-0 sortable" @click="handleSort('tipo')">
                  Tipo <component :is="sortKey === 'tipo' ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown" :size="14" />
                </th>
                <th class="py-3 px-3 border-0">Telefone</th>
                <th class="py-3 px-3 border-0 text-center sortable" @click="handleSort('status')">
                  Status <component :is="sortKey === 'status' ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown" :size="14" />
                </th>
                <th class="py-3 px-4 border-0 text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading"><td colspan="5" class="text-center py-5 text-muted">Carregando base de dados...</td></tr>
              <tr v-for="user in paginatedUsers" :key="user.id">
                <td class="px-4">
                  <div class="d-flex align-items-center">
                    <div class="avatar-circle me-3">{{ user.nome.charAt(0).toUpperCase() }}</div>
                    <div>
                      <div class="fw-bold text-dark">{{ user.nome }}</div>
                      <div class="text-muted small">{{ user.email }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-3">
                  <span class="badge" :class="user.tipo === 'admin' ? 'bg-dark' : 'bg-secondary'">{{ user.tipo }}</span>
                </td>
                <td class="px-3 text-muted small">{{ user.telefone || '-' }}</td>
                <td class="px-3 text-center">
                  <span :class="['status-dot', user.status === 'ativo' ? 'bg-success' : 'bg-danger']"></span>
                  <span class="small fw-bold text-uppercase">{{ user.status }}</span>
                </td>
                <td class="px-4 text-end">
                  <div class="btn-group shadow-sm border rounded bg-white">
                    <button class="btn btn-sm btn-light text-info" @click="selectedUser = user; showDetailsModal = true"><Eye :size="18" /></button>
                    <button class="btn btn-sm btn-light text-primary" @click="openModalEdit(user)"><Edit2 :size="18" /></button>
                    <button class="btn btn-sm btn-light" :class="user.status === 'ativo' ? 'text-warning' : 'text-success'" @click="toggleStatus(user)">
                      <component :is="user.status === 'ativo' ? UserX : UserCheck" :size="18" />
                    </button>
                    <button class="btn btn-sm btn-light text-danger" @click="confirmDelete(user)"><Trash2 :size="18" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINAÇÃO -->
        <div class="p-3 border-top bg-light d-flex justify-content-between align-items-center">
          <small class="text-muted">Página {{ currentPage }} de {{ totalPages }}</small>
          <nav>
            <ul class="pagination pagination-sm m-0">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button class="page-link" @click="currentPage--">Anterior</button>
              </li>
              <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <button class="page-link" @click="currentPage++">Próximo</button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>

    <!-- MODAL FORMULÁRIO -->
    <Transition name="fade">
      <div v-if="showModal" class="modal-overlay d-flex align-items-center justify-content-center">
        <div class="overlay-bg" @click="showModal = false"></div>
        <div class="card border-0 shadow-lg modal-content" style="max-width: 600px; width: 95%;">
          <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center p-4 pb-0">
            <h5 class="fw-bold m-0 text-dark">{{ isEditing ? 'Editar Usuário' : 'Cadastrar Usuário' }}</h5>
            <button class="btn btn-link text-muted p-0" @click="showModal = false"><X :size="24" /></button>
          </div>
          <div class="card-body p-4">
            <form @submit.prevent="handleSave" class="row g-3">
              <div class="col-md-12">
                <label class="form-label small fw-bold text-muted text-uppercase">Nome Completo</label>
                <div class="input-group">
                  <span class="input-group-text bg-light"><User :size="18"/></span>
                  <input type="text" class="form-control" v-model="form.nome" required placeholder="Ex: João Silva">
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold text-muted text-uppercase">E-mail</label>
                <div class="input-group">
                  <span class="input-group-text bg-light"><Mail :size="18"/></span>
                  <input type="email" class="form-control" v-model="form.email" required placeholder="email@total.com">
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold text-muted text-uppercase">Telefone</label>
                <div class="input-group">
                  <span class="input-group-text bg-light"><Phone :size="18"/></span>
                  <input type="text" class="form-control" v-model="form.telefone" placeholder="(11) 99999-9999">
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold text-muted text-uppercase">Senha</label>
                <div class="input-group">
                  <span class="input-group-text bg-light"><Lock :size="18"/></span>
                  <input :type="showFormPassword ? 'text' : 'password'" class="form-control" v-model="form.senha" required>
                  <button type="button" class="btn btn-light border" @click="showFormPassword = !showFormPassword">
                    <Eye v-if="!showFormPassword" :size="16"/><EyeOff v-else :size="16"/>
                  </button>
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold text-muted text-uppercase">Tipo de Acesso</label>
                <select class="form-select" v-model="form.tipo">
                  <option value="usuario">Usuário Comum</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div class="col-12 d-flex gap-2 justify-content-end mt-4">
                <button type="button" class="btn btn-light fw-bold px-4" @click="showModal = false">Cancelar</button>
                <button type="submit" class="btn btn-primary text-white fw-bold px-4" :disabled="isSaving">
                  <span v-if="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                  {{ isEditing ? 'Atualizar' : 'Salvar Usuário' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>

    <!-- MODAL VISUALIZAÇÃO -->
    <Transition name="fade">
      <div v-if="showDetailsModal" class="modal-overlay d-flex align-items-center justify-content-center">
        <div class="overlay-bg" @click="showDetailsModal = false"></div>
        <div class="card border-0 shadow-lg modal-content" style="max-width: 450px; width: 95%;">
          <div class="card-header bg-dark text-white p-3 border-0 d-flex justify-content-between">
            <h6 class="m-0 fw-bold">Detalhes do Registro</h6>
            <button class="btn btn-sm btn-link text-white p-0" @click="showDetailsModal = false"><X :size="20"/></button>
          </div>
          <div class="card-body p-0">
             <table class="table table-striped mb-0 small">
               <tbody>
                 <tr v-for="(val, key) in selectedUser" :key="key">
                   <td class="fw-bold text-primary text-uppercase ps-3 py-2" style="width: 35%">{{ key }}</td>
                   <td class="text-dark py-2">{{ val }}</td>
                 </tr>
               </tbody>
             </table>
          </div>
          <div class="card-footer bg-light text-end">
             <button class="btn btn-secondary btn-sm fw-bold px-4" @click="showDetailsModal = false">Fechar</button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
/* CORES TEMA TOTAL ENERGIES / ORANGE */
.text-primary { color: #f97316 !important; }
.bg-primary { background-color: #f97316 !important; border-color: #f97316 !important; }
.bg-orange-subtle { background-color: #fff7ed !important; }
.btn-primary:hover { background-color: #ea580c !important; transform: translateY(-1px); transition: 0.2s; }

.avatar-circle { 
  width: 40px; height: 40px; background: #f97316; color: white; 
  border-radius: 50%; display: flex; align-items: center; 
  justify-content: center; font-weight: bold; 
}

.status-dot {
  display: inline-block; width: 8px; height: 8px; 
  border-radius: 50%; margin-right: 6px;
}

.sortable { cursor: pointer; user-select: none; }
.sortable:hover { background-color: #fff7ed; }

/* MODAIS */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 1050; }
.overlay-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); }
.modal-content { background: white; z-index: 1060; border-radius: 12px; animation: slideUp 0.3s ease-out; }

@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

/* TOAST */
.custom-toast { 
  position: fixed; top: 20px; left: 50%; transform: translateX(-50%); 
  color: white; padding: 12px 25px; border-radius: 50px; 
  box-shadow: 0 5px 15px rgba(0,0,0,0.2); z-index: 9999; 
  display: flex; align-items: center; font-weight: 600; 
}

.rotate { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
