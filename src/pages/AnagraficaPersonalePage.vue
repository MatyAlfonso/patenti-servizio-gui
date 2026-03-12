<template>
  <div class="page-container">
    <div class="header-section">
      <h2>Anagrafica del personale</h2>

      <SearchBar v-model="searchQuery" placeholder="Cerca per cognome, nome o CF..." />

      <button class="btn-new" @click="showModal = true">
        <Icon name="add" size="18" /> Nuova persona
      </button>
    </div>

    <Modal v-if="showModal" title="Nuova persona" @close="showModal = false">
      <form @submit.prevent="submitNewPerson" class="grid-form">
        <div class="form-group">
          <label>Cognome</label>
          <input v-model="personForm.cognome" type="text" required />
        </div>
        <div class="form-group">
          <label>Nome</label>
          <input v-model="personForm.nome" type="text" required />
        </div>
        <div class="form-group">
          <label>Codice Fiscale</label>
          <input v-model="personForm.codice_fiscale" type="text" required />
        </div>
        <div class="form-group">
          <label>Data di nascita</label>
          <input v-model="personForm.data_nascita" type="date" required />
        </div>
        <div class="form-group">
          <label>Luogo di nascita</label>
          <input v-model="personForm.luogo_nascita" type="text" required />
        </div>
        <div class="form-actions">
          <button type="button" @click="showModal = false" class="btn-cancel">
            Annulla
          </button>
          <button type="submit" class="btn-save" :disabled="isSaving">Salva</button>
        </div>
      </form>
    </Modal>

    <div v-if="loading">Caricando personale...</div>
    <div v-else-if="error">{{ error }}</div>
    <DataTable v-else :items="filteredPeople" :columns="tableColumns" />
    <Toast
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      @close="toast.show = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { apiClient } from "@/services/api";
import DataTable from "@/components/DataTable.vue";
import Modal from "@/components/Modal.vue";
import Icon from "@/components/Icon.vue";
import Toast from "@/components/Toast.vue";
import SearchBar from "@/components/SearchBar.vue";

const people = ref([]);
const loading = ref(true);
const isSaving = ref(false);
const showModal = ref(false);
const error = ref(null);
const searchQuery = ref("");

const initialPersonState = {
  cognome: "",
  nome: "",
  codice_fiscale: "",
  data_nascita: "",
  luogo_nascita: "",
};

const personForm = ref({ ...initialPersonState });

const tableColumns = [
  { key: "cognome", label: "Cognome" },
  { key: "nome", label: "Nome" },
  { key: "codice_fiscale", label: "Codice fiscale" },
  { key: "data_nascita", label: "Data di nascita" },
  { key: "luogo_nascita", label: "Luogo di nascita" },
];

const toast = ref({
  show: false,
  message: "",
  type: "success",
});

const filteredPeople = computed(() => {
  const query = searchQuery.value.toLowerCase();

  if (!query) return people.value;

  return people.value.filter((p) => {
    return (
      p.cognome.toLowerCase().includes(query) ||
      p.nome.toLowerCase().includes(query) ||
      p.codice_fiscale.toLowerCase().includes(query)
    );
  });
});

const loadPeople = async () => {
  try {
    loading.value = true;
    people.value = await apiClient.get("/persone");
  } catch (err) {
    error.value = "Nessun personale trovato.";
  } finally {
    loading.value = false;
  }
};

const submitNewPerson = async () => {
  try {
    isSaving.value = true;
    await apiClient.post("/persone", personForm.value);
    showModal.value = false;
    personForm.value = { ...initialPersonState };
    await loadPeople();
    showToast("Persona salvata con successo!");
  } catch (err) {
    showToast("Errore: " + err.message, "error");
  } finally {
    isSaving.value = false;
  }
};

const showToast = (msg, type = "success") => {
  toast.value = { show: true, message: msg, type };
  setTimeout(() => {
    toast.value.show = false;
  }, 4000);
};

onMounted(loadPeople);
</script>

<style scoped>
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.btn-new {
  background-color: #ff5900;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}
.grid-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.form-group label {
  font-weight: bold;
  font-size: 0.9rem;
  color: #555;
}
.form-group input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
.btn-cancel {
  background: #eee;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
}
.btn-save {
  background: #0067b1;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
.btn-save:disabled {
  background: #ccc;
}
</style>
