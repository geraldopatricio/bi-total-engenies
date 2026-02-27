<script setup>
import { ref, computed } from 'vue';
import { Search, Plus, Eye, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-vue-next';

const props = defineProps({
  title: String,
  columns: Array, // [{ key: 'id', label: 'ID' }, ...]
  data: Array     // [{ id: 1, nome: '...' }, ...]
});

// Estados
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;

// Filtro de Busca Global
const filteredData = computed(() => {
  if (!searchQuery.value) return props.data;
  const lowerSearch = searchQuery.value.toLowerCase();
  
  return props.data.filter(item => {
    return Object.values(item).some(val => 
      String(val).toLowerCase().includes(lowerSearch)
    );
  });
});

// Paginação Lógica
const totalPages = computed(() => Math.ceil(filteredData.value.length / itemsPerPage));

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredData.value.slice(start, end);
});

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};
</script>

<template>
  <div class="container-fluid p-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold text-dark m-0">{{ title }}</h4>
      <button class="btn btn-primary d-flex align-items-center gap-2 fw-bold text-white">
        <Plus :size="18" /> Novo Cadastro
      </button>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        
        <!-- Toolbar (Search) -->
        <div class="p-3 border-bottom d-flex align-items-center bg-light rounded-top">
          <div class="input-group" style="max-width: 300px;">
            <span class="input-group-text bg-white border-end-0"><Search :size="16" class="text-muted"/></span>
            <input 
              type="text" 
              class="form-control border-start-0 ps-0" 
              placeholder="Pesquisar..." 
              v-model="searchQuery"
            >
          </div>
          <div class="ms-auto text-muted small">
            Exibindo {{ paginatedData.length }} de {{ filteredData.length }} registros
          </div>
        </div>

        <!-- Tabela -->
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light text-muted small text-uppercase">
              <tr>
                <th v-for="col in columns" :key="col.key" class="py-3 px-3 fw-bold border-0">
                  {{ col.label }}
                </th>
                <th class="py-3 px-3 fw-bold border-0 text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in paginatedData" :key="index">
                <td v-for="col in columns" :key="col.key" class="px-3 py-2 text-secondary">
                  {{ item[col.key] }}
                </td>
                <td class="text-end px-3">
                  <div class="d-flex justify-content-end gap-2">
                    <button class="btn btn-sm btn-light text-info" title="Visualizar"><Eye :size="16" /></button>
                    <button class="btn btn-sm btn-light text-primary" title="Editar"><Edit2 :size="16" /></button>
                    <button class="btn btn-sm btn-light text-danger" title="Excluir"><Trash2 :size="16" /></button>
                  </div>
                </td>
              </tr>
              <tr v-if="paginatedData.length === 0">
                <td :colspan="columns.length + 1" class="text-center py-5 text-muted">
                  Nenhum registro encontrado.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginação -->
        <div class="d-flex justify-content-between align-items-center p-3 border-top bg-light rounded-bottom">
          <small class="text-muted">Página {{ currentPage }} de {{ totalPages }}</small>
          
          <nav>
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button class="page-link border-0 bg-transparent" @click="changePage(currentPage - 1)">
                  <ChevronLeft :size="16" />
                </button>
              </li>
              
              <li v-for="p in totalPages" :key="p" class="page-item" :class="{ active: p === currentPage }">
                <button class="page-link border-0 rounded mx-1" @click="changePage(p)">{{ p }}</button>
              </li>

              <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <button class="page-link border-0 bg-transparent" @click="changePage(currentPage + 1)">
                  <ChevronRight :size="16" />
                </button>
              </li>
            </ul>
          </nav>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.page-link.active {
  background-color: #f97316;
  color: white;
}
.page-link {
  color: #6c757d;
}
</style>