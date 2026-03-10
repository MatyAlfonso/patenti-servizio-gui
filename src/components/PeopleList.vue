<template>
  <div class="people-container">
    <h2>Anagrafica del personale</h2>

    <div v-if="loading">Loading data...</div>
    <div v-else-if="error">{{ error }}</div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>Cognome</th>
          <th>Nome</th>
          <th>Codice fiscale</th>
          <th>Data di nascita</th>
          <th>Luogo di nascita</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="person in people" :key="person.id">
          <td>{{ person.cognome }}</td>
          <td>{{ person.nome }}</td>
          <td>{{ person.codice_fiscale }}</td>
          <td>{{ person.data_nascita }}</td>
          <td>{{ person.luogo_nascita }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { apiClient } from '../services/api';

const people = ref([]);
const loading = ref(true);
const error = ref(null);

const loadPeople = async () => {
  try {
    loading.value = true;
    people.value = await apiClient.get('/persone');
  } catch (err) {
    error.value = "Failed to fetch people registry.";
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(loadPeople);
</script>

<style scoped>


.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  border: 1px solid #ddd;
  padding: 8px;
}

.data-table th {
  background-color: #f4f4f4;
  text-align: left;
}
</style>