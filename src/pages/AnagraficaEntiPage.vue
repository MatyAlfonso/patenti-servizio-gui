<template>
    <div class="page-container">
        <h2>Anagrafica degli enti</h2>

        <div v-if="loading">Caricando enti...</div>
        <div v-else-if="error">{{ error }}</div>

        <DataTable v-else :items="entities" :columns="tableColumns" />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiClient } from '@/services/api';
import DataTable from '@/components/DataTable.vue';

const entities = ref([]);
const loading = ref(true);
const error = ref(null);

const tableColumns = [
    { key: 'descrizione', label: 'Descrizione' },
    { key: 'sq_richieste', label: 'SQ Richieste' },
    { key: 'sq_patenti', label: 'SQ Patenti' },
    { key: 'codice_utente_responsabile', label: 'Codice utente responsabile' },
];

const loadEntities = async () => {
    try {
        loading.value = true;
        entities.value = await apiClient.get('/enti');
    } catch (err) {
        error.value = "Nessun ente trovato.";
    } finally {
        loading.value = false;
    }
};

onMounted(loadEntities);
</script>