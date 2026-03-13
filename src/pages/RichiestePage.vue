<template>
  <div class="page-container">
    <div class="header-section">
      <h2>Richieste</h2>

      <div class="toolbar">
        <SearchBar v-model="searchQuery" placeholder="Cerca per cognome, nome o CF..." />

        <div class="filter-group">
          <select v-model="statusFilter" class="filter-select">
            <option value="ALL">Tutti gli stati</option>
            <option value="IN_PREPARAZIONE">In preparazione</option>
            <option value="INVIATA">Inviata</option>
            <option value="RESPINTA">Respinta</option>
          </select>
          <select v-model="sortOrder" class="filter-select">
            <option value="DESC">Più recenti</option>
            <option value="ASC">Più antichi</option>
          </select>
        </div>
      </div>

      <button class="btn-new" @click="showModal = true">
        <Icon name="add" size="18" /> Nuova richiesta
      </button>
    </div>

    <Modal
      v-if="showModal"
      title="Richiesta patente di servizio"
      @close="showModal = false"
    >
      <form @submit.prevent="submitRequest" class="grid-form">
        <fieldset>
          <legend>Tipologia</legend>
          <div class="file-grid">
            <div class="form-group">
              <label>Ente</label>
              <select v-model="form.id_ente" required>
                <option disabled value="">Seleziona l'ente...</option>
                <option v-for="e in entities" :key="e.id" :value="e.id">
                  {{ e.id }} - {{ e.descrizione }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Tipo richiesta</label>
              <select v-model="form.id_tipo" required>
                <option v-for="t in requestTypes" :key="t.id" :value="t.id">
                  {{ t.descrizione }}
                </option>
              </select>
            </div>
          </div>
        </fieldset>

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
              <label>Categoria patente civile</label>
              <select v-model="form.patente_civile_categorie" required>
                <option disabled value="">Seleziona categoria...</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.id }} - {{ cat.descrizione }}
                </option>
              </select>
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

    <Modal
      v-if="showDetailModal"
      :title="'Dettaglio richiesta'"
      @close="showDetailModal = false"
    >
      <div class="detail-container" v-if="selectedRequest">
        <div class="detail-grid">
          <div class="detail-images">
            <div class="image-box">
              <label>Fototessera</label>
              <img :src="`api/${selectedRequest.fototessera?.path}`" class="full-img" />
            </div>
            <div class="image-box">
              <label>Firma autografa</label>
              <img
                :src="`api/${selectedRequest.firma_scansionata?.path}`"
                class="full-img signature"
              />
            </div>
          </div>

          <div class="detail-info">
            <section>
              <h3>Dati personali</h3>
              <p>
                <strong>Cognome e nome:</strong>
                {{
                  selectedRequest.persona?.cognome + " " + selectedRequest?.persona?.nome
                }}
              </p>
              <p>
                <strong>Codice fiscale:</strong>
                {{ selectedRequest.persona?.codice_fiscale }}
              </p>
              <p>
                <strong>Data di nascita:</strong>
                {{ selectedRequest.persona?.data_nascita }}
              </p>
              <p>
                <strong>Luogo di nascita:</strong>
                {{ selectedRequest.persona?.luogo_nascita }}
              </p>
              <p><strong>Residenza:</strong> {{ selectedRequest.residenza_persona }}</p>
            </section>

            <section>
              <h3>Patente civile</h3>
              <p>
                <strong>Numero:</strong>
                {{ selectedRequest.persona?.patente_civile[0].numero }}
              </p>
              <p>
                <strong>Categoria patente civile:</strong>
                {{ selectedRequest.persona?.patente_civile[0].id_categoria }}
              </p>
              <p>
                <strong>Data rilascio:</strong>
                {{ selectedRequest.persona?.patente_civile[0].data_rilascio }}
              </p>
              <p>
                <strong>Valida fino al:</strong>
                {{ selectedRequest.persona?.patente_civile[0].data_scadenza }}
              </p>
            </section>

            <section>
              <h3>Richiesta</h3>
              <p><strong>Ente:</strong> {{ selectedRequest.ente?.descrizione }}</p>
              <p>
                <strong>Stato: </strong>
                <span :class="['badge', selectedRequest.id_stato]">
                  {{ selectedRequest.stato?.descrizione }}
                </span>
              </p>
            </section>
          </div>
        </div>

        <div class="form-actions">
          <button
            v-if="selectedRequest.id_stato === 'IN_PREPARAZIONE'"
            class="btn-reject"
            @click="rejectRequest(selectedRequest)"
          >
            <Icon name="block" size="18" /> Respingi
          </button>

          <button
            v-if="selectedRequest.id_stato === 'IN_PREPARAZIONE'"
            class="btn-save"
            @click="
              printLicense(selectedRequest);
              showDetailModal = false;
            "
          >
            <Icon name="print" size="18" /> Approva e stampa
          </button>
        </div>
      </div>
    </Modal>

    <div v-if="loading">Caricando...</div>
    <div v-else-if="error">{{ error }}</div>
    <DataTable :items="filteredAndFormattedRichieste" :columns="columns">
      <template #cell-foto="{ item }">
        <div class="images-container">
          <img
            v-if="item.raw.fototessera"
            :src="`api/${item.raw.fototessera.path}`"
            class="thumbnail"
          />
          <img
            v-if="item.raw.fototessera"
            :src="`api/${item.raw.firma_scansionata.path}`"
            class="thumbnail"
          />
          <Icon v-else name="account_circle" color="#ccc" />
        </div>
      </template>

      <template #cell-stato_richiesta="{ item }">
        <span :class="['badge', item.raw.id_stato]">
          {{ item.raw.stato?.descrizione || item.stato_richiesta }}
        </span>
      </template>

      <template #actions="{ item }">
        <button class="btn-icon details" @click="viewDetails(item.raw)" title="Dettagli">
          <Icon name="visibility" size="18" />
        </button>

        <button
          v-if="item.raw.id_stato === 'IN_PREPARAZIONE'"
          class="btn-icon reject"
          @click="rejectRequest(item.raw)"
          title="Respingi"
        >
          <Icon name="block" size="18" />
        </button>

        <button
          v-if="item.raw.id_stato === 'IN_PREPARAZIONE'"
          class="btn-icon print"
          @click="printLicense(item.raw)"
          title="Stampa"
        >
          <Icon name="print" size="18" />
        </button>
      </template>
    </DataTable>
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
import Toast from "@/components/Toast.vue";
import Icon from "@/components/Icon.vue";
import SearchBar from "@/components/SearchBar.vue";

const showModal = ref(false);
const showPersonModal = ref(false);
const showDetailModal = ref(false);
const selectedRequest = ref(null);
const isSavingPerson = ref(false);
const loading = ref(true);
const isSaving = ref(false);
const error = ref(null);
const searchQuery = ref("");
const statusFilter = ref("ALL");
const sortOrder = ref("DESC");

const richieste = ref([]);
const people = ref([]);
const entities = ref([]);
const categories = ref([]);
const requestTypes = ref([]);

const personForm = ref({
  cognome: "",
  nome: "",
  codice_fiscale: "",
  data_nascita: "",
  luogo_nascita: "",
});

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
  id_stato: "IN_PREPARAZIONE",
};
const form = ref({ ...initialFormState });

const toast = ref({
  show: false,
  message: "",
  type: "success",
});

const files = { foto: null, firma: null };

const columns = [
  { key: "data", label: "Data" },
  { key: "cognome", label: "Cognome" },
  { key: "nome", label: "Nome" },
  { key: "ente", label: "Ente" },
  { key: "tipo_richiesta", label: "Tipo" },
  { key: "stato_richiesta", label: "Stato" },
  { key: "foto", label: "Allegati" },
];

const filteredAndFormattedRichieste = computed(() => {
  const query = searchQuery.value.toLowerCase();

  let result = richieste.value.map((r) => ({
    id: r.id,
    data_raw: new Date(r.data_richiesta),
    data: new Date(r.data_richiesta).toLocaleDateString(),
    cognome: r.persona?.cognome || "",
    nome: r.persona?.nome || "",
    codice_fiscale: r.persona?.codice_fiscale || "",
    ente: r.ente?.descrizione || "",
    tipo_richiesta: r.tipo?.descrizione || "",
    stato_richiesta: r.stato?.descrizione || "",
    id_stato: r.id_stato,
    raw: r,
  }));

  if (statusFilter.value !== "ALL") {
    result = result.filter((r) => r.id_stato === statusFilter.value);
  }

  if (query) {
    result = result.filter(
      (r) =>
        r.cognome.toLowerCase().includes(query) ||
        r.nome.toLowerCase().includes(query) ||
        r.codice_fiscale.toLowerCase().includes(query)
    );
  }

  return result.sort((a, b) => {
    return sortOrder.value === "ASC" ? a.data_raw - b.data_raw : b.data_raw - a.data_raw;
  });
});

const loadData = async () => {
  try {
    loading.value = true;
    const [
      resRichieste,
      resPeople,
      resEntities,
      resCategories,
      resTypes,
    ] = await Promise.all([
      apiClient.get("/richieste"),
      apiClient.get("/persone"),
      apiClient.get("/enti"),
      apiClient.get("/categorie-patenti"),
      apiClient.get("/tipi-richieste"),
    ]);
    richieste.value = resRichieste;
    people.value = resPeople;
    entities.value = resEntities;
    categories.value = resCategories;
    requestTypes.value = resTypes;
  } catch (err) {
    error.value = "Errore nel caricamento dati.";
  } finally {
    loading.value = false;
  }
};

const showToast = (msg, type = "success") => {
  toast.value = { show: true, message: msg, type };
  setTimeout(() => {
    toast.value.show = false;
  }, 4000);
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
    showToast("Richiesta salvata con successo!");
  } catch (err) {
    showToast("Errore: " + err.message, "error");
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

    showToast("Persona creata correttamente");
  } catch (err) {
    showToast("Errore nella creazione della persona", "error");
  } finally {
    isSavingPerson.value = false;
  }
};

const resetForm = () => {
  form.value = { ...initialFormState };
  files.foto = null;
  files.firma = null;
};

const printLicense = async (item) => {
  try {
    await apiClient.post(`/richieste/${item.id}/print`);

    showToast("Patente generata e inviata con successo!");
    await loadData();
  } catch (err) {
    showToast("Errore durante la stampa: " + err.message, "error");
  }
};

const rejectRequest = async (item) => {
  if (!confirm("Sei sicuro di voler respingere questa richiesta?")) return;

  try {
    await apiClient.patch(`/richieste/${item.id}`, {
      id_stato: "RESPINTA",
    });

    showToast("Richiesta respinta correctamente");
    showDetailModal.value = false;
    await loadData();
  } catch (err) {
    showToast("Errore durante il rifiuto: " + err.message, "error");
  }
};

const viewDetails = (item) => {
  selectedRequest.value = item;
  showDetailModal.value = true;
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

.thumbnail {
  width: 35px;
  height: 45px;
  object-fit: cover;
  border-radius: 4px;
  display: block;
  margin: 0 auto;
}

.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
}
.badge.IN_PREPARAZIONE {
  background: #fff3cd;
  color: #856404;
}
.badge.INVIATA {
  background: #d4edda;
  color: #155724;
}
.badge.RESPINTA {
  background: #f8d7da;
  color: #721c24;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.7;
  }
}
.btn-icon.details {
  color: #646464;
}
.btn-icon.print {
  color: #0067b1;
}
.btn-reject {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 5px;
}
.btn-reject:hover {
  background-color: #c82333;
}
.btn-icon.reject {
  color: #dc3545;
}

.detail-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 30px;
}

.detail-images {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.image-box {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.image-box label {
  font-size: 0.8rem;
  font-weight: bold;
  color: #666;
}

.full-img {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f9f9f9;
}

.full-img.signature {
  height: 80px;
  object-fit: contain;
}

.detail-info section {
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.detail-info h3 {
  margin: 0 0 10px 0;
  font-size: 1rem;
  color: #0067b1;
}

.detail-info p {
  margin: 5px 0;
  font-size: 0.9rem;
}

.images-container {
  display: flex;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 1rem;
}

.filter-group label {
  font-weight: bold;
  font-size: 0.9rem;
  color: #666;
}

.filter-select {
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background: white;
  outline: none;
}

.filter-select:focus {
  border-color: #0067b1;
}
</style>
