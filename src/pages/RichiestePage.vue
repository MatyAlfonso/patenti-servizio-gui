<template>
  <div class="page-container">
    <div class="header-section">
      <h2>Richieste</h2>
      <button class="btn-new" @click="showModal = true">+ Nuova richiesta</button>
    </div>

    <Modal
      v-if="showModal"
      title="Richiesta patente di servizio"
      @close="showModal = false"
    >
      <form @submit.prevent="submitRequest" class="grid-form">
        <fieldset>
          <legend>Dati personali</legend>
          <div class="form-group">
            <label>Cognome e nome</label>
            <select v-model="form.id_persona" @change="checkNewPerson" required>
              <option disabled value="">Seleziona...</option>
              <option v-for="p in people" :key="p.id" :value="p.id">
                {{ p.cognome }} {{ p.nome }}
              </option>
              <option value="NEW_PERSON" class="option-add">
                + Aggiungi nuova persona...
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Residenza</label>
            <input v-model="form.residenza_persona" type="text" required />
          </div>
          <div class="form-group">
            <label>Direzione / Servizio di appartenenza </label>
            <input v-model="form.direzione_servizio" type="text" required />
          </div>
        </fieldset>

        <Modal
          v-if="showPersonModal"
          title="Anagrafica nuova persona"
          @close="showPersonModal = false"
        >
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
              <label>Codice fiscale</label>
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
              <button type="button" @click="showPersonModal = false" class="btn-cancel">
                Annulla
              </button>
              <button type="submit" class="btn-save" :disabled="isSavingPerson">
                Salva persona
              </button>
            </div>
          </form>
        </Modal>

        <fieldset>
          <legend>Dati patente civile posseduta</legend>
          <div class="file-grid">
            <div class="form-group">
              <label>Numero</label>
              <input v-model="form.patente_civile_numero" type="text" required />
            </div>
            <div class="form-group">
              <label>Categorie</label>
              <input
                v-model="form.patente_civile_categorie"
                type="text"
                placeholder="Es. B, C"
                required
              />
            </div>
          </div>
          <div class="file-grid">
            <div class="form-group">
              <label>Data rilascio</label>
              <input v-model="form.patente_civile_rilascio" type="date" required />
            </div>
            <div class="form-group">
              <label>Valida fino al </label>
              <input v-model="form.patente_civile_scadenza" type="date" required />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Documentazione</legend>
          <div class="file-grid">
            <div class="form-group">
              <label>Foto (33x40 mm)</label>
              <input
                type="file"
                @change="(e) => handleFile(e, 'foto')"
                accept="image/*"
                required
              />
            </div>
            <div class="form-group">
              <label>Firma</label>
              <input
                type="file"
                @change="(e) => handleFile(e, 'firma')"
                accept="image/*"
                required
              />
            </div>
          </div>
        </fieldset>

        <div class="form-actions">
          <button type="button" @click="showModal = false" class="btn-cancel">
            Annulla
          </button>
          <button type="submit" class="btn-save" :disabled="isSaving">Salva</button>
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
const showPersonModal = ref(false);
const isSavingPerson = ref(false);
const loading = ref(true);
const isSaving = ref(false);
const error = ref(null);

const richieste = ref([]);
const people = ref([]);
const entities = ref([]);

const initialFormState = {
  id_persona: "",
  id_ente: "",
  residenza_persona: "",
  direzione_servizio: "",
  patente_civile_numero: "",
  patente_civile_categorie: "",
  patente_civile_rilascio: "",
  patente_civile_scadenza: "",
  note_richiedente: "",
  id_tipo: "NUOVA",
  id_stato: "IN_PREP",
};

const personForm = ref({
  cognome: "",
  nome: "",
  codice_fiscale: "",
  data_nascita: "",
  luogo_nascita: "",
});

const form = ref({ ...initialFormState });

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

    await apiClient.post("/richieste", formData);

    showModal.value = false;
    resetForm();
    await loadData();
    alert("Richiesta salvata con successo!");
  } catch (err) {
    alert("Errore durante il salvataggio: " + err.message);
  } finally {
    isSaving.value = false;
  }
};

const checkNewPerson = (event) => {
  if (event.target.value === "NEW_PERSON") {
    showPersonModal.value = true;
    form.value.id_persona = "";
  }
};

const submitNewPerson = async () => {
  try {
    isSavingPerson.value = true;
    const newPerson = await apiClient.post("/persone", personForm.value);

    const updatedPeople = await apiClient.get("/persone");
    people.value = updatedPeople;

    form.value.id_persona = newPerson.id;

    showPersonModal.value = false;
    Object.keys(personForm.value).forEach((key) => (personForm.value[key] = ""));
  } catch (err) {
    alert("Errore nella creazione della persona");
  } finally {
    isSavingPerson.value = false;
  }
};

const resetForm = () => {
  form.value = { ...initialFormState };
  files.foto = null;
  files.firma = null;
};

onMounted(loadData);
</script>

<style scoped>
fieldset {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
}
legend {
  font-weight: bold;
  color: #0067b1;
  padding: 0 10px;
}

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

.option-add {
  background-color: #f0f7ff;
  color: #0067b1;
  font-weight: bold;
}
</style>
