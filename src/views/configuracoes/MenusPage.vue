<script setup>
import { ref, onMounted, computed } from 'vue';
import { 
  Search, Plus, Edit2, Trash2, CheckCircle, AlertTriangle, X, 
  Menu, Link as LinkIcon, Folder, Layers
} from 'lucide-vue-next';

// === ESTADOS ===
const rawMenus = ref([]); // Estrutura em árvore vinda da API
const flatMenus = ref([]); // Estrutura plana para a tabela
const parentOptions = ref([]); // Apenas itens do tipo 'grupo' para o select de Pai

const searchQuery = ref('');
const isLoading = ref(false);
const isSaving = ref(false);

// Paginação
const currentPage = ref(1);
const itemsPerPage = 10;

// Modal e Formulário
const showModal = ref(false);
const isEditing = ref(false);
const form = ref({
  id: null,
  titulo: '',
  icone: '',
  rota: '',
  tipo: 'link', // link, grupo, separador
  pai_id: '',
  ordem: 0
});

// Toast
const toast = ref({ show: false, msg: '', type: 'success' });

// === UTILITÁRIOS ===

const showToast = (msg, type) => {
  toast.value = { show: true, msg, type };
  setTimeout(() => toast.value.show = false, 4000);
};

// Transforma a árvore (Pai -> Filhos) em uma lista plana para a tabela
const processMenuData = (data) => {
  const flat = [];
  const parents = [];

  data.forEach(pai => {
    // Adiciona o Pai
    flat.push({ ...pai, isChild: false, parentName: '-' });
    
    // Se for grupo, guarda para usar no select
    if (pai.tipo === 'grupo') {
      parents.push(pai);
    }

    // Adiciona os Filhos (se houver)
    if (pai.submenus && pai.submenus.length > 0) {
      pai.submenus.forEach(filho => {
        flat.push({ ...filho, isChild: true, parentName: pai.titulo });
      });
    }
  });

  flatMenus.value = flat;
  parentOptions.value = parents;
};

// === API ===

// 1. Listar (GET)
const fetchMenus = async () => {
  isLoading.value = true;
  try {
    const response = await fetch('http://localhost:3000/menus', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    });
    if (response.ok) {
      const data = await response.json();
      rawMenus.value = data;
      processMenuData(data);
    } else {
      throw new Error('Falha ao carregar menus');
    }
  } catch (error) {
    showToast('Erro ao listar menus', 'error');
  } finally {
    isLoading.value = false;
  }
};

// 2. Salvar (POST/PUT)
const handleSave = async () => {
  isSaving.value = true;
  try {
    let url = `${import.meta.env.VITE_API_URL}/menus`;
    let method = 'POST';
    
    const payload = {
      titulo: form.value.titulo,
      icone: form.value.icone,
      rota: form.value.rota,
      tipo: form.value.tipo,
      ordem: parseInt(form.value.ordem),
      pai_id: form.value.pai_id ? parseInt(form.value.pai_id) : null
    };

    if (isEditing.value) {
      url = `${import.meta.env.VITE_API_URL}/menus/${form.value.id}`;
      method = 'PUT';
    }

    const response = await fetch(url, {
      method: method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Erro ao salvar menu');

    showToast(isEditing.value ? 'Menu atualizado!' : 'Menu criado!', 'success');
    showModal.value = false;
    fetchMenus();

  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    isSaving.value = false;
  }
};

// 3. Excluir (DELETE)
const handleDelete = async (id) => {
  if (!confirm('Tem certeza? Se for um Grupo, os submenus também serão excluídos.')) return;

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/menus/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    });

    if (!response.ok) throw new Error('Erro ao excluir');

    showToast('Menu removido.', 'success');
    fetchMenus();
  } catch (error) {
    showToast(error.message, 'error');
  }
};

// === LÓGICA DE TELA ===

const filteredData = computed(() => {
  if (!searchQuery.value) return flatMenus.value;
  const lower = searchQuery.value.toLowerCase();
  return flatMenus.value.filter(m => m.titulo.toLowerCase().includes(lower));
});

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredData.value.slice(start, end);
});

const totalPages = computed(() => Math.ceil(filteredData.value.length / itemsPerPage));

const openModalCreate = () => {
  isEditing.value = false;
  form.value = { id: null, titulo: '', icone: '', rota: '', tipo: 'link', pai_id: '', ordem: 0 };
  showModal.value = true;
};

const openModalEdit = (menu) => {
  isEditing.value = true;
  form.value = { 
    id: menu.id,
    titulo: menu.titulo,
    icone: menu.icone || '',
    rota: menu.rota || '',
    tipo: menu.tipo,
    pai_id: menu.pai_id || '',
    ordem: menu.ordem
  };
  showModal.value = true;
};

onMounted(() => {
  fetchMenus();
});
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

    <!-- HEADER -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold text-dark m-0">Gerenciamento de Menus</h4>
      <button class="btn btn-primary d-flex align-items-center gap-2 fw-bold text-white shadow-sm" @click="openModalCreate">
        <Plus :size="18" /> Novo Menu
      </button>
    </div>

    <!-- CARD DATAGRID -->
    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        
        <!-- Toolbar -->
        <div class="p-3 border-bottom bg-light rounded-top d-flex align-items-center">
          <div class="input-group" style="max-width: 300px;">
            <span class="input-group-text bg-white border-end-0"><Search :size="16" class="text-muted"/></span>
            <input type="text" class="form-control border-start-0 ps-0" placeholder="Buscar menu..." v-model="searchQuery">
          </div>
          <div class="ms-auto text-muted small">
            {{ filteredData.length }} registros
          </div>
        </div>

        <!-- Tabela -->
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-orange-subtle text-primary small text-uppercase">
              <tr>
                <th class="py-3 px-3 border-0">Título</th>
                <th class="py-3 px-3 border-0 text-center">Tipo</th>
                <th class="py-3 px-3 border-0 text-center">Ícone</th>
                <th class="py-3 px-3 border-0">Rota</th>
                <th class="py-3 px-3 border-0">Pertence a</th>
                <th class="py-3 px-3 border-0 text-center">Ordem</th>
                <th class="py-3 px-3 border-0 text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading"><td colspan="7" class="text-center py-5 text-muted">Carregando...</td></tr>
              <tr v-else-if="filteredData.length === 0"><td colspan="7" class="text-center py-5 text-muted">Nenhum menu encontrado.</td></tr>
              
              <tr v-for="menu in paginatedData" :key="menu.id">
                <td class="px-3">
                  <div class="d-flex align-items-center gap-2">
                    <!-- Indentação visual para filhos -->
                    <span v-if="menu.isChild" class="text-muted ms-3 border-start border-bottom" style="width: 10px; height: 10px; display: inline-block;"></span>
                    <span class="fw-bold text-dark">{{ menu.titulo }}</span>
                  </div>
                </td>
                
                <!-- Tipo -->
                <td class="px-3 text-center">
                  <span class="badge border" 
                    :class="{
                      'bg-light text-dark': menu.tipo === 'link',
                      'bg-orange-subtle text-primary': menu.tipo === 'grupo',
                      'bg-secondary text-white': menu.tipo === 'separador'
                    }">
                    {{ menu.tipo.toUpperCase() }}
                  </span>
                </td>

                <td class="px-3 text-center text-muted small">{{ menu.icone || '-' }}</td>
                <td class="px-3 small text-secondary">{{ menu.rota || '-' }}</td>
                <td class="px-3 small text-muted">{{ menu.parentName }}</td>
                <td class="px-3 text-center">{{ menu.ordem }}</td>

                <!-- Ações -->
                <td class="px-3 text-end">
                  <div class="d-flex gap-2 justify-content-end">
                    <button class="btn btn-sm btn-light text-primary hover-scale" @click="openModalEdit(menu)" title="Editar">
                        <Edit2 :size="18" />
                    </button>
                    <button class="btn btn-sm btn-light text-danger hover-scale" @click="handleDelete(menu.id)" title="Excluir">
                        <Trash2 :size="18" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginação -->
        <div class="d-flex justify-content-between p-3 border-top bg-light rounded-bottom align-items-center">
          <small class="text-muted">Página {{ currentPage }} de {{ totalPages }}</small>
          <nav>
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button class="page-link" @click="currentPage--">Anterior</button>
              </li>
              <li class="page-item active">
                <span class="page-link bg-primary border-primary">{{ currentPage }}</span>
              </li>
              <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <button class="page-link" @click="currentPage++">Próximo</button>
              </li>
            </ul>
          </nav>
        </div>

      </div>
    </div>

    <!-- === MODAL === -->
    <Transition name="fade">
      <div v-if="showModal" class="modal-overlay d-flex align-items-center justify-content-center">
        <div class="overlay-bg" @click="showModal = false"></div>
        
        <div class="card border-0 shadow-lg p-0 modal-content" style="max-width: 500px; width: 90%;">
          <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center p-4 pb-0">
            <h5 class="fw-bold m-0">{{ isEditing ? 'Editar Menu' : 'Novo Menu' }}</h5>
            <button class="btn btn-link text-muted p-0" @click="showModal = false"><X :size="24" /></button>
          </div>

          <div class="card-body p-4">
            <form @submit.prevent="handleSave">
              
              <!-- Título -->
              <div class="mb-3">
                <label class="form-label small fw-bold text-muted">Título do Menu</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0"><Menu :size="18" class="text-muted"/></span>
                  <input type="text" class="form-control border-start-0" v-model="form.titulo" required>
                </div>
              </div>

              <!-- Tipo -->
              <div class="mb-3">
                <label class="form-label small fw-bold text-muted">Tipo de Item</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0"><Layers :size="18" class="text-muted"/></span>
                  <select class="form-select border-start-0" v-model="form.tipo">
                    <option value="link">Link (Página)</option>
                    <option value="grupo">Grupo (Tem submenus)</option>
                    <option value="separador">Separador (Título visual)</option>
                  </select>
                </div>
              </div>

              <!-- Pai (Só aparece se não for separador e não for grupo pai de si mesmo logicamente) -->
              <div class="mb-3" v-if="form.tipo === 'link'">
                <label class="form-label small fw-bold text-muted">Menu Pai (Opcional)</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0"><Folder :size="18" class="text-muted"/></span>
                  <select class="form-select border-start-0" v-model="form.pai_id">
                    <option value="">-- Raiz --</option>
                    <option v-for="p in parentOptions" :key="p.id" :value="p.id">{{ p.titulo }}</option>
                  </select>
                </div>
              </div>

              <div class="row">
                <!-- Rota -->
                <div class="col-md-8 mb-3" v-if="form.tipo !== 'separador'">
                  <label class="form-label small fw-bold text-muted">Rota / Link</label>
                  <div class="input-group">
                    <span class="input-group-text bg-light border-end-0"><LinkIcon :size="18" class="text-muted"/></span>
                    <input type="text" class="form-control border-start-0" v-model="form.rota" placeholder="/exemplo">
                  </div>
                </div>

                <!-- Ordem -->
                <div class="col-md-4 mb-3">
                  <label class="form-label small fw-bold text-muted">Ordem</label>
                  <input type="number" class="form-control" v-model="form.ordem">
                </div>
              </div>

              <!-- Ícone -->
              <div class="mb-4" v-if="form.tipo !== 'separador'">
                <label class="form-label small fw-bold text-muted">Nome do Ícone (Lucide)</label>
                <input type="text" class="form-control" v-model="form.icone" placeholder="ex: Users, Home, Settings">
                <small class="text-muted" style="font-size: 0.7rem;">Use nomes da biblioteca Lucide Vue Next.</small>
              </div>

              <div class="d-flex gap-2 justify-content-end">
                <button type="button" class="btn btn-light" @click="showModal = false">Cancelar</button>
                <button type="submit" class="btn btn-primary text-white fw-bold px-4" :disabled="isSaving">
                  <span v-if="isSaving" class="spinner-border spinner-border-sm me-2"></span> Salvar
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
/* CORES */
.bg-orange-subtle { background-color: #ffedd5 !important; }
.text-primary { color: #f97316 !important; }
.bg-primary { background-color: #f97316 !important; border-color: #f97316 !important; }
.btn-primary:hover { background-color: #ea580c !important; border-color: #ea580c !important; }

/* Inputs */
.form-control:focus, .form-select:focus { box-shadow: none; border-color: #f97316; }
.input-group-text { background-color: #f8f9fa; }
.hover-scale:hover { transform: scale(1.1); transition: transform 0.2s; }

/* Toast */
.custom-toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); color: white; padding: 10px 20px; border-radius: 50px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); z-index: 9999; display: flex; align-items: center; font-weight: 600; }
.bg-success { background-color: #22c55e; } .bg-danger { background-color: #ef4444; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(-20px); }

/* Modal */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 1050; }
.overlay-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(2px); }
.modal-content { z-index: 1060; animation: slideUp 0.3s ease-out; }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>