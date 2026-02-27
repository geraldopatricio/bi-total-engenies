<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import axios from 'axios';
import { Bar, Doughnut, Pie } from 'vue-chartjs';
import { 
  Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, RadialLinearScale, ArcElement, PointElement, LineElement 
} from 'chart.js';
import { 
  Car, Bike, Truck, Eraser, List, PieChart, BarChart3, Info, ChevronLeft, ChevronRight, Globe, Settings2, X, Filter, Clock, TrendingUp, MapPin, DollarSign, Zap
} from 'lucide-vue-next'; 
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// --- REGISTRO DO CHART.JS ---
ChartJS.register(CategoryScale, LinearScale, RadialLinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend);

// --- ESTADOS DE CONTROLE ---
const viewMode = ref('executive'); 
const showSidebar = ref(false);
const selectedStateName = ref('');
const hoveredStateId = ref(null);
const hintInfo = ref({ visible: false, x: 0, y: 0, uf: '', frota: 0 });

// --- FILTROS ---
const filters = ref({
  tipo: 'Leve', 
  anoInicio: 2000,
  anoFim: 2025,
  marca: 'VW',
  modelo: 'Todos',
  motor: 'Todos',
  litros: '< 1.6',
  viscosidade: 'Viscosidades',
  api: 'API',
  acea: 'ACEA',
  norma: 'VW 504.00/507.00',
  uf: 'Todos'
});

// KPIs Animados
const kpisAnimados = ref({ litros: 0, frota: 0, leve: 0, pesada: 0, moto: 0 });
const targetKpis = ref({ litros: 366553081, frota: 24784026, leve: 17239970, pesada: 883165, moto: 6660891 });

// --- MAPBOX CONFIG ---
const mapContainer = ref(null);
const map = ref(null);
const MAPBOX_TOKEN = 'pk.eyJ1IjoicGF0cmljaW9tZWxvIiwiYSI6ImNqMzZocXN5bTAwMHcycW4xbDFldTRwZmgifQ.1FE9u3161-wNaMGRMv5OWA'; 

const UF_COORDS = {
  'AC': [-70.55, -9.02], 'AL': [-36.78, -9.57], 'AP': [-52.00, 0.90], 'AM': [-65.00, -3.41], 'BA': [-41.70, -12.57], 'CE': [-39.60, -5.20], 'DF': [-47.92, -15.78], 'ES': [-40.30, -19.18], 'GO': [-49.26, -15.93], 'MA': [-45.00, -5.00], 'MT': [-56.09, -12.68], 'MS': [-54.50, -20.77], 'MG': [-44.38, -18.51], 'PA': [-52.00, -3.50], 'PB': [-36.50, -7.23], 'PR': [-51.50, -24.60], 'PE': [-37.00, -8.00], 'PI': [-42.50, -7.71], 'RJ': [-42.50, -22.00], 'RN': [-36.50, -5.79], 'RS': [-53.00, -30.00], 'RO': [-62.50, -11.50], 'RR': [-61.30, 2.82], 'SC': [-50.00, -27.00], 'SP': [-48.00, -22.00], 'SE': [-37.50, -10.57], 'TO': [-48.33, -10.16]
};

// --- INSIGHTS ESTRATÉGICOS ---
const currentInsights = computed(() => {
  if (filters.value.uf === 'Todos') {
    return [
      { label: 'Frota Elegível', value: '14,7M', desc: 'veículos', icon: Car },
      { label: 'Sudeste concentra', value: '48%', desc: 'do mercado nacional', icon: Globe },
      { label: 'Diesel presente em', value: '27%', desc: 'da frota total', icon: Truck },
      { label: 'Idade média da frota', value: '12,5 anos', desc: 'média nacional', icon: Clock }
    ];
  } else {
    return [
      { label: `Frota em ${selectedStateName.value}`, value: '2,1M', desc: 'veículos ativos', icon: MapPin },
      { label: 'Market Share', value: '12.4%', desc: 'participação nacional', icon: TrendingUp },
      { label: 'Ticket Médio/Troca', value: 'R$ 452', desc: 'estimado na região', icon: DollarSign },
      { label: 'Potencial Lubrificante', value: '850k', desc: 'litros/mês (Est.)', icon: Zap }
    ];
  }
});

// --- CONFIGURAÇÃO DE GRÁFICOS ---
const chartOptionsBase = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { borderDash: [2, 2], color: '#e2e8f0' }, ticks: { font: { size: 10 } } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } } };

const lubricantData = { labels: ['5W30 SL', '10W30 SL', '10W40 SL', '5W40 SN', '20W50 SL', '5W30 SN', '15W40 SL', '0W20 SN', '5W30 SP', '15W50 SN'], datasets: [{ label: 'Litros', backgroundColor: '#e97332', data: [15, 5, 7, 9, 2, 8, 6, 3, 3, 1] }] };
const topCitiesData = { labels: ['SAO PAULO', 'CAMPINAS', 'GUARULHOS', 'SAO BERNARDO', 'RIBEIRAO PRETO'], datasets: [{ label: 'Veículos', backgroundColor: '#e97332', data: [90, 15, 12, 10, 8] }] };
const segmentData = { labels: ['LEVE', 'MOTO', 'PESADA'], datasets: [{ data: [33.33, 33.33, 33.33], backgroundColor: ['#e97332', '#f4b393', '#fbe2d5'], borderWeight: 0 }] };
const yearsData = { labels: ['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016'], datasets: [{ label: 'Frota', backgroundColor: '#e97332', data: [2, 5, 4, 4.2, 4, 3, 5.2, 5, 4, 3.8] }] };

// --- FUNÇÕES ---
const fmtNum = (v) => new Intl.NumberFormat('pt-BR').format(Math.floor(v));

const animateNumbers = (dataObj) => {
    const duration = 2000;
    const start = performance.now();
    const initialValues = { ...kpisAnimados.value };
    const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        Object.keys(initialValues).forEach(key => {
            kpisAnimados.value[key] = initialValues[key] + (dataObj[key] - initialValues[key]) * progress;
        });
        if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
};

const initMap = () => {
    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.value = new mapboxgl.Map({
        container: mapContainer.value,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-55, -10], zoom: 1, projection: 'globe', attributionControl: false
    });

    map.value.on('load', () => {
        map.value.addSource('brazil-states', { type: 'geojson', data: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson', generateId: true });
        map.value.addLayer({ 'id': 'states-fill', 'type': 'fill', 'source': 'brazil-states', 'paint': {
    'fill-color': '#f97316',
    'fill-opacity': [
        'case',
        ['any', 
            ['boolean', ['feature-state', 'hover'], false],
            ['==', ['get', 'sigla'], filters.value.uf] // Mantém preenchimento se clicado
        ],
        0.25,
        0.03
    ]
} });
        map.value.addLayer({ 'id': 'states-borders', 'type': 'line', 'source': 'brazil-states', 'paint': {
    'line-color': '#e97332',
    'line-width': [
        'case',
        ['any', 
            ['boolean', ['feature-state', 'hover'], false],
            ['==', ['get', 'sigla'], filters.value.uf] // Mantém borda grossa se clicado
        ],
        3,
        0.5
    ]
} });
        
        map.value.flyTo({ center: [-52, -18], zoom: 3.8, duration: 2500 });
        animateNumbers(targetKpis.value);

        map.value.on('mousemove', 'states-fill', (e) => {
            if (e.features.length > 0) {
                if (hoveredStateId.value !== null) map.value.setFeatureState({ source: 'brazil-states', id: hoveredStateId.value }, { hover: false });
                hoveredStateId.value = e.features[0].id;
                map.value.setFeatureState({ source: 'brazil-states', id: hoveredStateId.value }, { hover: true });
                hintInfo.value = { visible: true, x: e.point.x + 15, y: e.point.y + 15, uf: e.features[0].properties.sigla, frota: 1953790 };
            }
        });

        map.value.on('mouseleave', 'states-fill', () => {
          if (hoveredStateId.value !== null) {
              map.value.setFeatureState({ source: 'brazil-states', id: hoveredStateId.value }, { hover: false });
          }
          hoveredStateId.value = null;
          
          // SÓ ESCONDE SE NÃO HOUVER UF SELECIONADA
          if (filters.value.uf === 'Todos') {
              hintInfo.value.visible = false;
          }
      });

        map.value.on('click', 'states-fill', (e) => {
          const props = e.features[0].properties;
          selectedStateName.value = props.name || props.sigla;
          filters.value.uf = props.sigla;

          // FORÇA O HINT A FICAR VISÍVEL E COM OS DADOS DO CLIQUE
          hintInfo.value = {
              visible: true,
              uf: props.sigla,
              frota: 1953790 // Aqui você pode usar o dado real vindo do seu mapData
          };

          const coords = UF_COORDS[props.sigla] || e.lngLat;
          map.value.flyTo({ center: coords, zoom: 5.5, duration: 1500 });
            
            const mult = Math.random() * 0.3 + 0.1;
            animateNumbers({
                litros: targetKpis.value.litros * mult,
                frota: targetKpis.value.frota * mult,
                leve: targetKpis.value.leve * mult,
                pesada: targetKpis.value.pesada * mult,
                moto: targetKpis.value.moto * mult
            });
        });
    });
};

const resetToBrazil = () => {
    selectedStateName.value = '';
    filters.value.uf = 'Todos';
    hintInfo.value.visible = false; // ESCONDE O HINT AO VOLTAR
    map.value.flyTo({ center: [-52, -18], zoom: 3.8, duration: 1500 });
    animateNumbers(targetKpis.value);
};

onMounted(() => initMap());
</script>

<template>
  <div class="dashboard-container">
    
    <!-- TELA 1: PANORAMA ESTRATÉGICO -->
    <div v-show="viewMode === 'executive'" class="view-wrapper p-4">
      <div class="row g-4 align-items-stretch mb-4">
        <div class="col-lg-8">
          <div class="card map-card h-100 position-relative border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <div class="p-4 position-absolute top-0 start-0 z-2">
              <h3 class="fw-bold m-0">Panorama Estratégico por Região</h3>
              <p class="text-muted small">Análise de mercado e potencial de frotas</p>
            </div>
            <div ref="mapContainer" class="w-100 h-100" style="min-height: 600px;"></div>
            
            <div v-if="hintInfo.visible" class="custom-hint shadow-lg border" :style="{ left: hintInfo.x + 'px', top: hintInfo.y + 'px' }">
                <div class="p-3">
                    <div class="d-flex justify-content-between gap-5 mb-1 text-nowrap"><span>Sigla Mapa</span><strong>BR-{{ hintInfo.uf }}</strong></div>
                    <div class="d-flex justify-content-between gap-5 mb-2 text-nowrap"><span>frota Geral</span><strong>{{ fmtNum(hintInfo.frota) }}</strong></div>
                    <hr class="my-2 opacity-10">
                    <div class="d-flex align-items-center justify-content-between text-muted"><small class="d-flex align-items-center gap-2"><div class="mini-circle"><ChevronRight :size="10"/></div> Drill-through</small><ChevronRight :size="14"/></div>
                </div>
            </div>

            <div v-if="selectedStateName" class="card-footer bg-white border-0 p-4 pt-0">
               <button @click="resetToBrazil" class="btn btn-orange-outline w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2">
                 <ChevronLeft :size="18"/> Voltar ao Brasil
               </button>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="card h-100 border-0 shadow-sm p-4 d-flex flex-column rounded-4 bg-white">
            <div class="d-flex align-items-center gap-3 mb-5">
              <div class="icon-circle-bg"><Globe class="text-orange" :size="24"/></div>
              <div><h2 class="fw-bold m-0">{{ selectedStateName || 'Brasil' }}</h2><small class="text-muted">Dados Consolidados</small></div>
            </div>
            <div class="mb-5"><h1 class="display-5 fw-black text-dark">{{ fmtNum(kpisAnimados.litros) }}</h1><small class="text-muted fw-bold">Litros</small></div>
            <div class="mb-5 border-top pt-4"><h2 class="fw-bold text-dark">{{ fmtNum(kpisAnimados.frota) }}</h2><small class="text-muted fw-bold">frota Geral</small></div>
            
            <div class="mt-auto">
                <label class="fw-bold mb-4 d-block text-dark">Segmento:</label>
                <div v-for="seg in [{l:'Leve', i:Car, k:'leve'}, {l:'Pesada', i:Truck, k:'pesada'}, {l:'Moto', i:Bike, k:'moto'}]" :key="seg.l" class="mb-4">
                    <div class="d-flex align-items-center gap-3">
                        <component :is="seg.i" class="text-orange" :size="30"/>
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between mb-1"><span class="small fw-bold">{{ fmtNum(kpisAnimados[seg.k]) }}</span><small class="text-muted">20%</small></div>
                            <div class="progress" style="height: 6px;"><div class="progress-bar bg-orange" style="width: 20%"></div></div>
                            <small class="text-muted">Linha {{ seg.l }}</small>
                        </div>
                    </div>
                </div>
                <button v-if="selectedStateName" @click="viewMode = 'detailed'" class="btn btn-orange w-100 py-3 mt-4 fw-bold shadow-sm">Avançar para Análise Detalhada</button>
            </div>
          </div>
        </div>
      </div>

      <!-- INSIGHTS INFERIORES -->
      <div class="row g-4">
        <div class="col-12">
          <div class="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <div class="row align-items-center">
              <div v-for="(insight, idx) in currentInsights" :key="idx" class="col-md-3" :class="idx < 3 ? 'border-end' : ''">
                <div class="d-flex align-items-center gap-3 px-3">
                  <div class="insight-icon-bg"><component :is="insight.icon" :size="20" class="text-orange"/></div>
                  <div>
                    <div class="d-flex align-items-baseline gap-2">
                      <span class="text-muted small fw-medium text-nowrap">{{ insight.label }}</span>
                      <span class="fw-bold text-dark fs-5">{{ insight.value }}</span>
                    </div>
                    <p class="text-muted small mb-0 text-nowrap">{{ insight.desc }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TELA 2: ANÁLISE DETALHADA -->
    <div v-show="viewMode === 'detailed'" class="view-wrapper detailed-bg pb-5">
        
        <div class="p-4 d-flex justify-content-between align-items-center bg-white shadow-sm mb-4">
            <div class="d-flex align-items-center gap-3">
                <button @click="viewMode = 'executive'" class="btn btn-light rounded-circle p-2 shadow-sm"><ChevronLeft :size="20"/></button>
                <h4 class="fw-bold m-0 text-dark">Análise do Estado {{ selectedStateName }}</h4>
            </div>
            <button @click="showSidebar = true" class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 px-3 border-2 fw-bold">
                <Filter :size="16"/> Filtros
            </button>
        </div>

        <div class="container-fluid px-4">
            
            <!-- GRID 4 CARDS SUPERIORES -->
            <div class="row g-3 mb-4">
                <div v-for="(k, idx) in [{l:'Marcas', v:'55'}, {l:'Modelos', v:'2.370'}, {l:'Veículos', v:'24.784.026'}, {l:'Litros / Ano', v:'366.553.081'}]" :key="k.l" class="col-md-3">
                    <div class="card border-0 shadow-sm p-4 d-flex flex-row align-items-center justify-content-center gap-4 rounded-4 bg-white">
                        <div class="custom-icon-volante" v-if="idx < 3">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e97332" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 15v5M5 12h3M16 12h3"/></svg>
                        </div>
                        <div class="custom-icon-oil" v-else>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e97332" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 3h-6l3-3zM5 10h14v10a2 2 0 01-2 2H7a2 2 0 01-2-2V10z"/><path d="M9 14h6"/></svg>
                        </div>
                        <div class="text-center">
                            <h2 class="fw-bold m-0 text-dark" style="font-size: 1.8rem;">{{ k.v }}</h2>
                            <small class="text-muted fw-bold uppercase" style="letter-spacing: 1px;">{{ k.l }}</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- GRID CENTRAL: AJUSTADO PARA LAYOUT LADO A LADO -->
            <div class="row g-3 mb-4">
                
                <!-- CARD 1: SEGMENTAÇÃO (LARGURA AUMENTADA PARA CABER OS 3 LADO A LADO) -->
                <div class="col-lg-7">
                    <div class="card border-0 shadow-sm p-4 h-100 rounded-4 bg-white">
                        <div class="row h-100">
                            <div v-for="(s, idx) in [
                              {l:'Veículos', v:'17.239.970', lit:'201.380.968,59', val:3, i:Car}, 
                              {l:'Veículos', v:'883.165', lit:'99.328.776,60', val:6, i:Truck}, 
                              {l:'Veículos', v:'6.660.891', lit:'65.843.335,71', val:9, i:Bike}
                            ]" :key="idx" class="col-4 border-end last-no-border px-3">
                                
                                <div class="d-flex align-items-start justify-content-between mb-3">
                                    <component :is="s.i" class="text-orange" :size="48"/>
                                    <div class="text-end">
                                        <h5 class="fw-bold m-0 text-dark">{{ s.v }}</h5>
                                        <small class="text-muted fw-bold">Veículos</small>
                                    </div>
                                </div>
                                
                                <div class="mb-4">
                                    <h4 class="fw-black m-0 text-dark">{{ s.lit }}</h4>
                                    <small class="text-muted fw-bold">Litros / ano</small>
                                </div>

                                <hr class="opacity-10 mb-4">

                                <div>
                                    <small class="text-muted fw-bold d-block mb-2">Trocas por Ano</small>
                                    <div class="d-flex flex-column gap-3">
                                        <input type="text" class="form-control form-control-sm text-center fw-bold border-0 bg-light" style="width: 50px;" :value="s.val">
                                        <div class="position-relative px-2">
                                            <input type="range" class="form-range custom-range-volante" min="1" max="12" :value="s.val">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- CARD 2: ESTADOS -->
                <div class="col-lg-2">
                    <div class="card border-0 shadow-sm p-4 h-100 rounded-4 bg-white">
                        <h6 class="fw-bold small text-muted mb-4 uppercase">ESTADOS</h6>
                        <div class="flex-grow-1">
                            <Bar :data="{labels:['SP'], datasets:[{backgroundColor:'#e97332', data:[0.35]}]}" :options="{ ...chartOptionsBase, scales: { y: { ...chartOptionsBase.scales.y, ticks: { callback: value => value + ' Bi' } } } }" />
                        </div>
                    </div>
                </div>

                <!-- CARD 3: TOP CIDADES -->
                <div class="col-lg-3">
                    <div class="card border-0 shadow-sm p-4 h-100 rounded-4 bg-white position-relative">
                        <h6 class="fw-bold small text-muted mb-4 uppercase">TOP CIDADES</h6>
                        <div class="flex-grow-1">
                            <Bar :data="topCitiesData" :options="{ ...chartOptionsBase, indexAxis: 'y' }" />
                        </div>
                        <div class="position-absolute shadow-lg border rounded p-2 bg-white" style="bottom: 40px; right: 10px; min-width: 150px; z-index: 10; font-size: 0.7rem;">
                            <div class="mb-1"><strong>SAO BERNARDO DO CAMPO</strong></div>
                            <div class="mb-1"><span class="text-muted">Litros por ano</span> <strong>7.766.242</strong></div>
                            <div><span class="text-muted">frota Geral</span> <strong>458.875</strong></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- GRID INFERIOR -->
            <div class="row g-3 mb-4">
                <div class="col-lg-4"><div class="card border-0 shadow-sm p-4 h-100 rounded-4 bg-white"><h6 class="fw-bold small text-muted mb-4 uppercase">LUBRIFICANTE</h6><div style="height: 220px;"><Bar :data="lubricantData" :options="chartOptionsBase" /></div></div></div>
                <div class="col-lg-4"><div class="card border-0 shadow-sm p-4 h-100 rounded-4 bg-white"><h6 class="fw-bold small text-muted mb-4 uppercase">SEGMENTO</h6><div style="height: 220px; position: relative;"><Doughnut :data="segmentData" :options="{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }" /></div></div></div>
                <div class="col-lg-4"><div class="card border-0 shadow-sm p-4 h-100 rounded-4 bg-white"><h6 class="fw-bold small text-muted mb-4 uppercase">ANO DE FABRICAÇÃO</h6><div style="height: 220px;"><Bar :data="yearsData" :options="chartOptionsBase" /></div></div></div>
            </div>

            <!-- PAINEL DE INSIGHTS (TELA 2) -->
            <div class="row g-4">
                <div class="col-12">
                <div class="card border-0 shadow-sm rounded-4 p-4 bg-white">
                    <div class="row align-items-center">
                    <div v-for="(insight, idx) in currentInsights" :key="idx" class="col-md-3" :class="idx < 3 ? 'border-end' : ''">
                        <div class="d-flex align-items-center gap-3 px-3">
                        <div class="insight-icon-bg"><component :is="insight.icon" :size="20" class="text-orange"/></div>
                        <div>
                            <div class="d-flex align-items-baseline gap-2">
                            <span class="text-muted small fw-medium text-nowrap">{{ insight.label }}</span>
                            <span class="fw-bold text-dark fs-5">{{ insight.value }}</span>
                            </div>
                            <p class="text-muted small mb-0">{{ insight.desc }}</p>
                        </div>
                        </div>
                    </div>
                    </div>
                </div>
                </div>
            </div>
        </div>
    </div>

    <!-- SIDEBAR FILTROS -->
    <div :class="['sidebar-overlay', showSidebar ? 'active' : '']" @click="showSidebar = false"></div>
    <div :class="['sidebar-panel shadow-lg', showSidebar ? 'open' : '']">
        <div class="p-4 h-100 d-flex flex-column">
            <div class="d-flex justify-content-between align-items-center mb-5">
                <h4 class="fw-bold m-0 text-dark">Filtros Avançados</h4>
                <button @click="showSidebar = false" class="btn btn-light rounded-circle"><X :size="20"/></button>
            </div>
            <div class="flex-grow-1 overflow-auto pe-2">
                <div class="mb-4"><label class="fw-bold small mb-2 d-block text-muted">Segmento</label>
                    <div class="btn-group w-100 shadow-sm"><button v-for="t in ['Leve', 'Moto', 'Pesado']" :key="t" :class="['btn btn-sm py-2 fw-bold', filters.tipo === t ? 'btn-orange' : 'btn-outline-secondary']" @click="filters.tipo = t">{{ t }}</button></div>
                </div>
                <div class="mb-4 p-3 bg-light rounded-3 border">
                    <div class="d-flex justify-content-between fw-bold mb-2"><span>Ano</span><span class="text-orange">{{ filters.anoFim }}</span></div>
                    <input type="range" class="form-range custom-range" min="2000" max="2025" v-model="filters.anoFim">
                    <div class="d-flex justify-content-between small text-muted mt-1 fw-bold"><span>< 2000</span><span>2025 ></span></div>
                </div>
                <div class="mb-4 border-top pt-4"><label class="fw-bold small mb-3 text-muted">Dados da Frota</label>
                    <select class="form-select mb-2 rounded-3 border-2 fw-medium" v-model="filters.marca"><option>VW</option></select>
                    <select class="form-select mb-2 rounded-3 border-2 fw-medium"><option>Todos</option></select>
                    <select class="form-select mb-2 rounded-3 border-2 fw-medium"><option>Todos</option></select>
                    <select class="form-select rounded-3 border-2 fw-medium"><option>< 1.6</option></select>
                </div>
                <div class="mb-4 border-top pt-4"><label class="fw-bold small mb-3 text-muted">Especificação do Lubrificante</label>
                    <select class="form-select mb-2 rounded-3 border-2 fw-medium"><option>Viscosidades</option></select>
                    <select class="form-select mb-2 rounded-3 border-2 fw-medium"><option>API</option></select>
                    <select class="form-select mb-2 rounded-3 border-2 fw-medium"><option>ACEA</option></select>
                    <select class="form-select rounded-3 border-2 fw-medium"><option>VW 504.00/507.00</option></select>
                </div>
            </div>
            <div class="d-flex gap-2 mt-4 pt-4 border-top">
                <button class="btn btn-light flex-grow-1 fw-bold py-3 rounded-3" @click="showSidebar = false">Limpar</button>
                <button class="btn btn-orange flex-grow-1 text-white fw-bold py-3 rounded-3" @click="showSidebar = false">Aplicar Filtros</button>
            </div>
        </div>
    </div>

  </div>
</template>

<style scoped>
.dashboard-container { background-color: #f1f5f9; min-height: 100vh; font-family: 'Inter', sans-serif; overflow-x: hidden; }
.detailed-bg { background-color: #f8fafc; }
.fw-black { font-weight: 900; }
.uppercase { text-transform: uppercase; letter-spacing: 0.5px; }

/* CORES INSTITUCIONAIS */
.text-orange { color: #e97332 !important; }
.bg-orange { background-color: #e97332 !important; }
.btn-orange { background-color: #e97332; color: white; border: none; transition: 0.3s; }
.btn-orange:hover { background-color: #d15f22; transform: translateY(-2px); }
.btn-orange-outline { border: 2px solid #e97332; color: #e97332; background: white; transition: 0.3s; }
.btn-orange-outline:hover { background: #fff1eb; }

/* ICONES */
.icon-circle-bg { width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #fff1eb; }
.insight-icon-bg { width: 42px; height: 42px; background-color: #fff1eb; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mini-circle { width: 18px; height: 18px; border: 1px solid #ccc; border-radius: 50%; display: flex; align-items: center; justify-content: center; }

/* SLIDER VOLANTE (Círculo maior) */
.custom-range-volante {
  -webkit-appearance: none;
  width: 100%;
  height: 4px;
  background: #e2e8f0;
  border-radius: 5px;
  outline: none;
}
.custom-range-volante::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  background: white;
  border: 2px solid #64748b;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* SIDEBAR */
.sidebar-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.4); backdrop-filter: blur(2px); z-index: 2000; opacity: 0; pointer-events: none; transition: 0.3s; }
.sidebar-overlay.active { opacity: 1; pointer-events: all; }
.sidebar-panel { position: fixed; top: 0; right: -400px; width: 380px; height: 100vh; background: white; z-index: 2001; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.sidebar-panel.open { right: 0; }

.last-no-border:last-child { border-end: none !important; border-bottom: none !important; }
.progress { background-color: #e2e8f0; border-radius: 10px; overflow: hidden; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.view-wrapper { animation: fadeIn 0.5s ease-out; }

:deep(.mapboxgl-ctrl-bottom-right), :deep(.mapboxgl-ctrl-bottom-left) { display: none; }
</style>