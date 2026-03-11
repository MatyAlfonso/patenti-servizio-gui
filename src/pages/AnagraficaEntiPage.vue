<template>
  <div class="page-container">
    <div class="header-section">
      <h2>Anagrafica degli enti</h2>
      <button class="btn-new" @click="showModal = true">+ Nuovo Ente</button>
    </div>

    <Modal v-if="showModal" title="Nuovo Ente" @close="showModal = false">
      <form @submit.prevent="submitNewEntity" class="grid-form">
        <div class="form-group">
          <label>Codice ente</label>
          <input
            v-model="entityForm.id"
            type="text"
            placeholder="Es: PCR, CFR"
            required
            style="text-transform: uppercase"
          />
        </div>

        <div class="form-group">
          <label>Descrizione</label>
          <input
            v-model="entityForm.descrizione"
            type="text"
            placeholder="Es: Protezione Civile Regionale"
            required
          />
        </div>

        <div class="form-actions">
          <button type="button" @click="showModal = false" class="btn-cancel">
            Annulla
          </button>
          <button type="submit" class="btn-save" :disabled="isSaving">Salva</button>
        </div>
      </form>
    </Modal>

    <div v-if="loading">Caricando enti...</div>
    <div v-else-if="error">{{ error }}</div>
    <DataTable v-else :items="entities" :columns="tableColumns" />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { apiClient } from "@/services/api";
import DataTable from "@/components/DataTable.vue";
import Modal from "@/components/Modal.vue";

const entities = ref([]);
const loading = ref(true);
const isSaving = ref(false);
const showModal = ref(false);
const error = ref(null);

const initialEntityState = {
  id: "",
  descrizione: "",
};

const entityForm = ref({ ...initialEntityState });

const tableColumns = [
  { key: "id", label: "Codice" },
  { key: "descrizione", label: "Descrizione" },
];

const loadEntities = async () => {
  try {
    loading.value = true;
    entities.value = await apiClient.get("/enti");
  } catch (err) {
    error.value = "Nessun ente trovato.";
  } finally {
    loading.value = false;
  }
};

const submitNewEntity = async () => {
  try {
    isSaving.value = true;
    await apiClient.post("/enti", entityForm.value);
    showModal.value = false;
    entityForm.value = { ...initialEntityState };
    await loadEntities();
  } catch (err) {
    alert("Errore nella creazione: " + err.message);
  } finally {
    isSaving.value = false;
  }
};

onMounted(loadEntities);
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
