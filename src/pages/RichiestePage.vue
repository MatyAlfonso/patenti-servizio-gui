<template>
  <div class="page-container">
    <div class="header-section">
      <h2>Richieste</h2>
      <button class="btn-new" @click="showModal = true">+ Nuova richiesta</button>
    </div>

    <Modal v-if="showModal" title="Nuova richiesta" @close="showModal = false">
      <form @submit.prevent="submitRequest" class="grid-form">
        <div class="form-group">
          <label>Cognome e nome</label>
          <select v-model="form.id_persona" required>
            <option disabled value="">Seleziona una persona...</option>
            <option v-for="p in people" :key="p.id" :value="p.id">
              {{ p.cognome }} {{ p.nome }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Ente</label>
          <select v-model="form.id_ente" required>
            <option disabled value="">Seleziona un ente...</option>
            <option v-for="e in entities" :key="e.id" :value="e.id">
              {{ e.descrizione }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Residenza</label>
          <input v-model="form.residenza_persona" type="text" required />
        </div>

        <div class="file-grid">
          <div class="form-group">
            <label>Fototessera</label>
            <input
              type="file"
              @change="(e) => handleFile(e, 'foto')"
              accept="image/*"
              required
            />
          </div>

          <div class="form-group">
            <label>Firma scansionata</label>
            <input
              type="file"
              @change="(e) => handleFile(e, 'firma')"
              accept="image/*"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label>Note richiedente</label>
          <textarea v-model="form.note_richiedente" rows="2"></textarea>
        </div>

        <div class="form-actions">
          <button type="button" @click="showModal = false" class="btn-cancel">
            Annulla
          </button>
          <button type="submit" class="btn-save" :disabled="isSaving">
            {{ isSaving ? "Salvando..." : "Salva" }}
          </button>
        </div>
      </form>
    </Modal>

    <div v-if="loading">Caricando...</div>
    <div v-else-if="error">{{ error }}</div>
    <DataTable v-else :items="formattedRichieste" :columns="columns" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { apiClient } from "@/services/api";
import DataTable from "@/components/DataTable.vue";
import Modal from "@/components/Modal.vue";

const showModal = ref(false);
const loading = ref(true);
const isSaving = ref(false);
const error = ref(null);

const richieste = ref([]);
const people = ref([]);
const entities = ref([]);

const form = ref({
  id_persona: "",
  id_ente: "",
  residenza_persona: "",
  note_richiedente: "",
  id_tipo: "NUOVA",
  id_stato: "IN_PREP",
});

const files = { foto: null, firma: null };

const columns = [
  { key: "data", label: "Data" },
  { key: "cognome", label: "Cognome" },
  { key: "nome", label: "Nome" },
  { key: "ente", label: "Ente" },
  { key: "tipo_richiesta", label: "Tipo" },
  { key: "stato_richiesta", label: "Stato" },
];

const formattedRichieste = computed(() => {
  return richieste.value.map((r) => ({
    id: r.id,
    data: new Date(r.data_richiesta).toLocaleDateString(),
    cognome: r.Persona?.cognome,
    nome: r.Persona?.nome,
    ente: r.Ente?.descrizione,
    tipo_richiesta: r.TipoRichiesta?.descrizione,
    stato_richiesta: r.StatoRichiesta?.descrizione,
  }));
});

const loadData = async () => {
  try {
    loading.value = true;
    const [resRichieste, resPeople, resEntities] = await Promise.all([
      apiClient.get("/richieste"),
      apiClient.get("/persone"),
      apiClient.get("/enti"),
    ]);
    richieste.value = resRichieste;
    people.value = resPeople;
    entities.value = resEntities;
  } catch (err) {
    error.value = "Errore nel caricamento dati.";
  } finally {
    loading.value = false;
  }
};

const handleFile = (e, type) => {
  files[type] = e.target.files[0];
};

const submitRequest = async () => {
  try {
    isSaving.value = true;
    const formData = new FormData();
    Object.keys(form.value).forEach((key) => formData.append(key, form.value[key]));
    if (files.foto) formData.append("fototessera", files.foto);
    if (files.firma) formData.append("firma", files.firma);

    const response = await fetch("http://localhost:3000/api/richieste", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      showModal.value = false;
      form.value = {
        id_persona: "",
        id_ente: "",
        residenza_persona: "",
        note_richiedente: "",
        id_tipo: "NUOVA",
        id_stato: "IN_PREP",
      };
      await loadData();
    }
  } catch (err) {
    alert("Errore durante il salvataggio");
  } finally {
    isSaving.value = false;
  }
};

onMounted(loadData);
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
.form-group input,
.form-group select,
.form-group textarea {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
}

.file-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
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
