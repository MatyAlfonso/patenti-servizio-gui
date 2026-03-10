<template>
    <div class="page-container">
        <h2>Anagrafica del personale</h2>

        <div v-if="loading">Caricando personale...</div>
        <div v-else-if="error">{{ error }}</div>

        <DataTable v-else :items="people" :columns="tableColumns" />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiClient } from '@/services/api';
import DataTable from '@/components/DataTable.vue';

const people = ref([]);
const loading = ref(true);
const error = ref(null);

const tableColumns = [
    { key: 'cognome', label: 'Last name' },
    { key: 'nome', label: 'First name' },
    { key: 'codice_fiscale', label: 'Codice fiscale' },
    { key: 'data_nascita', label: 'Data di nascita' },
    { key: 'luogo_nascita', label: 'Luogo di nascita' }
];

const loadPeople = async () => {
    try {
        loading.value = true;
        people.value = await apiClient.get('/persone');
    } catch (err) {
        error.value = "Nessun personale trovato.";
    } finally {
        loading.value = false;
    }
};

onMounted(loadPeople);
</script>