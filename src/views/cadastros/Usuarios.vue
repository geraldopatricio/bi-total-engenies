<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { 
  Search, Plus, Edit2, CheckCircle, AlertTriangle, X, User, Lock, Mail, 
  Shield, Activity, Trash2, Eye, EyeOff, Calendar, Briefcase, Unlock,
  Phone, Building, FileText, Download, UserCheck, UserX, RefreshCw, 
  Tag, Hash, ArrowUpDown, ArrowUp, ArrowDown 
} from 'lucide-vue-next';

// === ESTADOS (REATIVIDADE) ===
const users = ref([]);
const searchQuery = ref(''); // Campo de busca global instantânea
const isLoading = ref(false);
const isSaving = ref(false);
const showFormPassword = ref(false);

// === ESTADOS DE ORDENAÇÃO ===
const sortKey = ref('UserCreateDate'); 
const sortOrder = ref('desc'); 

// === ESTADOS DE PAGINAÇÃO ===
const currentPage = ref(1);
const itemsPerPage = 10;

// === LÓGICA DE FILTRAGEM INSTANTÂNEA E ORDENAÇÃO ===
const sortedAndFilteredUsers = computed(() => {
  const term = searchQuery.value.toLowerCase();
  
  // 1. Filtro de Busca Global (Pega todos os campos solicitados)
  let filtered = users.value.filter(u => {
    return (
      (u.name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.Username || '').toLowerCase().includes(term) ||
      (u.phone_number || '').toLowerCase().includes(term) ||
      (u['custom:cnpj'] || '').toLowerCase().includes(term) ||
      (u['custom:plano'] || '').toLowerCase().includes(term) ||
      (u['custom:asaas_tipo'] || '').toLowerCase().includes(term) ||
      (u['custom:industria'] || '').toLowerCase().includes(term)
    );
  });

  // 2. Ordenação (Order By)
  return filtered.sort((a, b) => {
    let modifier = sortOrder.value === 'asc' ? 1 : -1;
    let valA = a[sortKey.value] || '';
    let valB = b[sortKey.value] || '';

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return -1 * modifier;
    if (valA > valB) return 1 * modifier;
    return 0;
  });
});

const totalPages = computed(() => {
  return Math.ceil(sortedAndFilteredUsers.value.length / itemsPerPage) || 1;
});

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return sortedAndFilteredUsers.value.slice(start, end);
});

// Resetar página ao buscar ou ordenar
watch([searchQuery, sortKey, sortOrder], () => {
  currentPage.value = 1;
});

const handleSort = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};

// === ESTADOS DE MODAIS ===
const showModal = ref(false);
const showDetailsModal = ref(false);
const isEditing = ref(false);
const selectedUser = ref(null);

const form = ref({
  username: '', email: '', name: '', phone_number: '', senha: '',
  'custom:perfil': 'USUARIO', 'custom:plano': 'FREE', 'custom:industria': '',
  'custom:cnpj': '', 'custom:cnpjFornecedor': '', 'custom:asaas_tipo': '',
  'custom:origem_cadast': 'SISTEMA', 'custom:user_add': '', 'custom:user_update': '',
  'custom:email_7dias_enviado': 'nao'
});

const toast = ref({ show: false, msg: '', type: 'success' });
const apiHeaders = { 'Content-Type': 'application/json', 'x-api-key': import.meta.env.VITE_API_KEY };

// === UTILITÁRIOS ===
const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(new Date(dateString));
};

const showToast = (msg, type = 'success') => {
  toast.value = { show: true, msg, type };
  setTimeout(() => toast.value.show = false, 4000);
};

// === CHAMADAS DE API ===
const fetchUsers = async () => {
  isLoading.value = true;
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/cognito/usuarios`, { method: 'GET', headers: apiHeaders });
    if (!response.ok) throw new Error('Falha ao buscar usuários');
    users.value = await response.json();
  } catch (error) { showToast(error.message, 'error'); }
  finally { isLoading.value = false; }
};

const toggleUserStatus = async (user) => {
  const isBlocking = user.Enabled;
  const endpoint = isBlocking ? 'user-block' : 'user-unblock';
  if (!confirm(`Deseja alterar o status de ${user.name}?`)) return;
  try {
    await fetch(`${import.meta.env.VITE_API_URL}/cognito/${endpoint}/${user.Username}`, { method: 'POST', headers: apiHeaders });
    showToast('Status atualizado!');
    fetchUsers();
  } catch (e) { showToast('Erro ao mudar status', 'error'); }
};

const confirmDelete = async (username) => {
  if (!confirm(`EXCLUIR DEFINITIVAMENTE o usuário ${username}?`)) return;
  try {
    await fetch(`${import.meta.env.VITE_API_URL}/cognito/user-secure-delete/${username}`, { method: 'DELETE', headers: apiHeaders });
    showToast('Removido com sucesso!');
    fetchUsers();
  } catch (e) { showToast('Erro ao remover', 'error'); }
};

const handleSave = async () => {
  isSaving.value = true;
  try {
    const isEdit = isEditing.value;
    const url = isEdit ? `${import.meta.env.VITE_API_URL}/cognito/user/${form.value.username}` : `${import.meta.env.VITE_API_URL}/cognito/user`;
    const attributes = {
      "name": form.value.name, "phone_number": form.value.phone_number,
      "custom:perfil": form.value['custom:perfil'], "custom:plano": form.value['custom:plano'],
      "custom:industria": form.value['custom:industria'], "custom:cnpj": form.value['custom:cnpj'],
      "custom:cnpjFornecedor": form.value['custom:cnpjFornecedor'], "custom:asaas_tipo": form.value['custom:asaas_tipo'],
      "custom:origem_cadast": form.value['custom:origem_cadast'], "custom:user_add": form.value['custom:user_add'],
      "custom:user_update": form.value['custom:user_update'], "custom:email_7dias_enviado": form.value['custom:email_7dias_enviado']
    };
    const payload = isEdit ? { attributes } : { ...attributes, email: form.value.email, password: form.value.senha };
    if (isEdit && form.value.senha) payload.password = form.value.senha;
    const response = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: apiHeaders, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error('Erro na operação AWS');
    showToast('Dados processados com sucesso!');
    showModal.value = false;
    fetchUsers();
  } catch (error) { showToast(error.message, 'error'); }
  finally { isSaving.value = false; }
};

const openModalCreate = () => {
  isEditing.value = false; showFormPassword.value = false;
  form.value = { 
    username: '', email: '', name: '', phone_number: '', senha: '',
    'custom:perfil': 'USUARIO', 'custom:plano': 'FREE', 'custom:industria': '',
    'custom:cnpj': '', 'custom:cnpjFornecedor': '', 'custom:asaas_tipo': '',
    'custom:origem_cadast': 'SISTEMA', 'custom:user_add': 'Admin', 'custom:user_update': '',
    'custom:email_7dias_enviado': 'nao'
  };
  showModal.value = true;
};

const openModalEdit = (user) => {
  isEditing.value = true; showFormPassword.value = false;
  form.value = {
    username: user.Username, email: user.email, name: user.name, phone_number: user.phone_number,
    senha: '', 'custom:perfil': user['custom:perfil'] || 'USUARIO', 'custom:plano': user['custom:plano'] || 'FREE',
    'custom:industria': user['custom:industria'] || '', 'custom:cnpj': user['custom:cnpj'] || '',
    'custom:cnpjFornecedor': user['custom:cnpjFornecedor'] || '', 'custom:asaas_tipo': user['custom:asaas_tipo'] || '',
    'custom:origem_cadast': user['custom:origem_cadast'] || '', 'custom:user_add': user['custom:user_add'] || '',
    'custom:user_update': user['custom:user_update'] || '', 'custom:email_7dias_enviado': user['custom:email_7dias_enviado'] || 'nao'
  };
  showModal.value = true;
};

onMounted(() => fetchUsers());
</script>

<template>
  <div class="container-fluid p-4 position-relative">
    
    <!-- TOAST -->
    <Transition name="toast">
      <div v-if="toast.show" :class="['custom-toast', toast.type === 'success' ? 'bg-success' : 'bg-danger']">
        <component :is="toast.type === 'success' ? CheckCircle : AlertTriangle" :size="20" class="me-2" />
        <span>{{ toast.msg }}</span>
      </div>
    </Transition>

    <!-- CABEÇALHO -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold text-dark m-0 text-uppercase">Gerenciador de Usuários Cognito - Clientes LubConsulta</h4>
        <small class="text-muted">Administração Direta User Pool</small>
      </div>
      <button class="btn btn-primary d-flex align-items-center gap-2 fw-bold text-white shadow-sm" @click="openModalCreate">
        <Plus :size="18" /> Novo Usuário
      </button>
    </div>

    <!-- DATAGRID -->
    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        
        <!-- Toolbar com Pesquisa Global Instantânea -->
        <div class="p-3 border-bottom bg-light rounded-top d-flex align-items-center">
          <div class="input-group" style="max-width: 400px;">
            <span class="input-group-text bg-white border-end-0"><Search :size="16" class="text-muted"/></span>
            <input type="text" class="form-control border-start-0 ps-0" placeholder="Pesquisar por nome, email, fone, cnpj..." v-model="searchQuery">
          </div>
          <div class="ms-auto d-flex align-items-center gap-2">
             <button class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" @click="fetchUsers" :disabled="isLoading">
               <RefreshCw :size="14" :class="{ 'rotate': isLoading }"/> Sincronizar
             </button>
             <span class="text-muted small fw-bold ms-2">{{ sortedAndFilteredUsers.length }} registros</span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-orange-subtle text-primary small text-uppercase">
              <tr>
                <th class="py-3 px-4 border-0 sortable" @click="handleSort('name')">
                  Usuário <component :is="sortKey === 'name' ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown" :size="14" class="ms-1"/>
                </th>
                <th class="py-3 px-3 border-0 sortable" @click="handleSort('custom:plano')">
                  Perfil / Plano <component :is="sortKey === 'custom:plano' ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown" :size="14" class="ms-1"/>
                </th>
                <th class="py-3 px-3 border-0 sortable" @click="handleSort('phone_number')">
                  Telefone <component :is="sortKey === 'phone_number' ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown" :size="14" class="ms-1"/>
                </th>
                <th class="py-3 px-3 border-0 sortable" @click="handleSort('custom:asaas_tipo')">
                  Tipo Asaas <component :is="sortKey === 'custom:asaas_tipo' ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown" :size="14" class="ms-1"/>
                </th>
                <th class="py-3 px-3 border-0 text-center sortable" @click="handleSort('Enabled')">
                  Status <component :is="sortKey === 'Enabled' ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown" :size="14" class="ms-1"/>
                </th>
                <th class="py-3 px-3 border-0 sortable" @click="handleSort('UserCreateDate')">
                  Criação <component :is="sortKey === 'UserCreateDate' ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown" :size="14" class="ms-1"/>
                </th>
                <th class="py-3 px-4 border-0 text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading"><td colspan="7" class="text-center py-5 text-muted">Buscando dados na AWS...</td></tr>
              <tr v-for="user in paginatedUsers" :key="user.Username">
                <td class="px-4">
                  <div class="d-flex align-items-center">
                    <div class="avatar-circle me-3">{{ (user.name || 'U').charAt(0) }}</div>
                    <div class="d-flex flex-column">
                      <span class="fw-bold text-dark">{{ user.name || 'Sem Nome' }}</span>
                      <small class="text-muted" style="font-size: 0.75rem;">{{ user.email }}</small>
                    </div>
                  </div>
                </td>
                <td class="px-3">
                  <div class="d-flex flex-column gap-1">
                    <span class="badge bg-light text-dark border align-self-start">{{ user['custom:perfil'] || 'USUARIO' }}</span>
                    <span class="badge bg-info-subtle text-info border align-self-start">{{ user['custom:plano'] || 'FREE' }}</span>
                  </div>
                </td>
                <td class="px-3 small text-muted">{{ user.phone_number || '-' }}</td>
                <td class="px-3"><span class="badge bg-light text-dark border">{{ user['custom:asaas_tipo'] || '-' }}</span></td>
                <td class="px-3 text-center">
                  <span class="badge" :class="user.Enabled ? 'bg-success' : 'bg-danger'">
                    {{ user.Enabled ? 'Ativo' : 'Bloqueado' }}
                  </span>
                </td>
                <td class="px-3 small text-secondary">{{ formatDateTime(user.UserCreateDate) }}</td>
                <td class="px-4 text-end">
                  <div class="btn-group shadow-sm border rounded bg-white">
                    <button class="btn btn-sm btn-light text-info" @click="selectedUser = user; showDetailsModal = true" title="Ver Tudo"><Eye :size="18" /></button>
                    <button class="btn btn-sm btn-light text-primary" @click="openModalEdit(user)" title="Editar"><Edit2 :size="18" /></button>
                    <button v-if="user.Enabled" class="btn btn-sm btn-light text-warning" @click="toggleUserStatus(user)" title="Bloquear"><Lock :size="18" /></button>
                    <button v-else class="btn btn-sm btn-light text-success" @click="toggleUserStatus(user)" title="Desbloquear"><Unlock :size="18" /></button>
                    <button v-if="!user.Enabled" class="btn btn-sm btn-light text-danger" @click="confirmDelete(user.Username)" title="Excluir"><Trash2 :size="18" /></button>
                  </div>
                </td>
              </tr>
              <tr v-if="paginatedUsers.length === 0 && !isLoading">
                <td colspan="7" class="text-center py-5 text-muted small">Nenhum resultado para "{{ searchQuery }}".</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINAÇÃO -->
        <div class="p-3 border-top bg-light d-flex justify-content-between align-items-center rounded-bottom">
          <small class="text-muted">Exibindo página {{ currentPage }} de {{ totalPages }}</small>
          <nav>
            <ul class="pagination pagination-sm m-0">
              <li class="page-item" :class="{ disabled: currentPage === 1 }"><button class="page-link" @click="currentPage--">Anterior</button></li>
              <li v-for="page in totalPages" :key="page" class="page-item" :class="{ active: currentPage === page }">
                <button v-if="page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1" class="page-link" @click="currentPage = page">{{ page }}</button>
                <span v-else-if="Math.abs(page - currentPage) === 2" class="page-link border-0 bg-transparent">...</span>
              </li>
              <li class="page-item" :class="{ disabled: currentPage === totalPages }"><button class="page-link" @click="currentPage++">Próximo</button></li>
            </ul>
          </nav>
        </div>
      </div>
    </div>

    <!-- MODAL CADASTRO / EDIÇÃO -->
    <Transition name="fade">
      <div v-if="showModal" class="modal-overlay d-flex align-items-center justify-content-center">
        <div class="overlay-bg" @click="showModal = false"></div>
        <div class="card border-0 shadow-lg modal-content" style="max-width: 800px; width: 95%;">
          <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center p-4 pb-0">
            <h5 class="fw-bold m-0 text-dark">{{ isEditing ? 'Editar Usuário Cognito' : 'Registrar Novo Usuário' }}</h5>
            <button class="btn btn-link text-muted p-0" @click="showModal = false"><X :size="24" /></button>
          </div>
          <div class="card-body p-4 scroll-form">
            <form @submit.prevent="handleSave" class="row g-3">
              <div class="col-12 border-bottom pb-2"><small class="text-primary fw-bold">DADOS BÁSICOS</small></div>
              <div class="col-md-6">
                <label class="form-label small fw-bold text-muted">Nome Completo</label>
                <input type="text" class="form-control" v-model="form.name" required>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold text-muted">E-mail</label>
                <input type="email" class="form-control" v-model="form.email" :disabled="isEditing" required>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold text-muted">Telefone</label>
                <input type="text" class="form-control" v-model="form.phone_number" placeholder="+55...">
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold text-muted">{{ isEditing ? 'Alterar Senha' : 'Senha Inicial' }}</label>
                <div class="input-group">
                  <span class="input-group-text bg-light"><Lock :size="16"/></span>
                  <input :type="showFormPassword ? 'text' : 'password'" class="form-control" v-model="form.senha" :required="!isEditing" placeholder="••••••••">
                  <button type="button" class="btn btn-light border-start-0" @click="showFormPassword = !showFormPassword">
                    <Eye v-if="!showFormPassword" :size="18"/><EyeOff v-else :size="18"/>
                  </button>
                </div>
              </div>
              <div class="col-12 border-bottom pb-2 mt-4"><small class="text-primary fw-bold">ATRIBUTOS CUSTOMIZADOS</small></div>
              <div class="col-md-4">
                <label class="form-label small fw-bold text-muted">Perfil</label>
                <select class="form-select" v-model="form['custom:perfil']">
                  <option value="ADMIN">ADMIN</option><option value="GERENTE">GERENTE</option><option value="USUARIO">USUARIO</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold text-muted">Plano</label>
                <select class="form-select" v-model="form['custom:plano']">
                  <option value="BASICO">BASICO</option><option value="PLUS">PLUS</option><option value="TESTE GRATUITO 7 DIAS">TESTE GRATUITO 7 DIAS</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold text-muted">Asaas Tipo</label>
                <input type="text" class="form-control" v-model="form['custom:asaas_tipo']">
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold text-muted">Indústria</label>
                <input type="text" class="form-control" v-model="form['custom:industria']">
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold text-muted">CNPJ Empresa</label>
                <input type="text" class="form-control" v-model="form['custom:cnpj']">
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold text-muted">CNPJ Fornecedor</label>
                <input type="text" class="form-control" v-model="form['custom:cnpjFornecedor']">
              </div>
              <div class="col-12 d-flex gap-2 justify-content-end mt-4">
                <button type="button" class="btn btn-light fw-bold" @click="showModal = false">Cancelar</button>
                <button type="submit" class="btn btn-primary text-white fw-bold px-4" :disabled="isSaving">Salvar</button>
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
        <div class="card border-0 shadow-lg modal-content" style="max-width: 700px; width: 95%;">
          <div class="card-header bg-dark text-white d-flex justify-content-between p-3 border-0">
            <h6 class="m-0 fw-bold">Registro Completo AWS</h6>
            <button class="btn btn-sm btn-outline-light border-0" @click="showDetailsModal = false"><X :size="20"/></button>
          </div>
          <div class="card-body p-0 bg-white">
             <div class="table-responsive" style="max-height: 450px;">
                <table class="table table-sm table-striped mb-0">
                  <tbody>
                    <tr v-for="(val, key) in selectedUser" :key="key">
                      <td class="fw-bold small text-primary ps-3" style="width: 40%">{{ key }}</td>
                      <td class="small text-break pe-3 text-dark">{{ val || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
             </div>
          </div>
          <div class="card-footer bg-light text-end p-3">
             <button class="btn btn-secondary fw-bold px-4" @click="showDetailsModal = false">Fechar</button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.bg-orange-subtle { background-color: #fff7ed !important; }
.text-primary { color: #f97316 !important; }
.bg-primary { background-color: #f97316 !important; border-color: #f97316 !important; }
.btn-primary:hover { background-color: #ea580c !important; }
.avatar-circle { width: 38px; height: 38px; background: #f97316; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1rem; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 1050; }
.overlay-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(4px); }
.modal-content { background: #fff !important; z-index: 1060; border-radius: 12px; overflow: hidden; animation: slideIn 0.3s ease-out; }
.scroll-form { max-height: 80vh; overflow-y: auto; }
.pagination .page-link { color: #f97316; border-color: #dee2e6; cursor: pointer; }
.pagination .page-item.active .page-link { background-color: #f97316; border-color: #f97316; color: white; }
.custom-toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); color: white; padding: 12px 25px; border-radius: 50px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); z-index: 9999; display: flex; align-items: center; font-weight: 600; }
.rotate { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes slideIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
.badge { font-size: 0.7rem; padding: 0.45em 0.85em; font-weight: 600; }
.bg-info-subtle { background-color: #e0f2fe !important; }
.sortable { cursor: pointer; user-select: none; transition: background 0.2s; }
.sortable:hover { background-color: rgba(249, 115, 22, 0.1); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.toast-enter-active, .toast-leave-active { transition: all 0.4s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, -20px); }
</style>