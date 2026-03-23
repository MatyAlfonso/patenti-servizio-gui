<template>
  <div class="page-container">
    <div class="header-section">
      <h2>Richieste</h2>

      <div class="toolbar">
        <SearchBar v-model="searchQuery" placeholder="Cerca per cognome, nome o CF..." />

        <Filter
          v-model:statusFilter="statusFilter"
          v-model:sortOrder="sortOrder"
          :options="statusOptions"
        />
      </div>

      <button class="btn-new" @click="openCreateModal">
        <Icon name="add" size="18" /> Nuova richiesta
      </button>
    </div>

    <Modal
      v-if="showModal"
      title="Richiesta patente di servizio"
      @close="showModal = false"
    >
      <form @submit.prevent="submitRequest" class="grid-form">
        <div class="flex">
          <h4>MODULO RICHIESTA RILASCIO PATENTE DI SERVIZIO --</h4>
          <label
            ><input type="radio" value="NUOVA" v-model="form.id_tipo" required />
            Nuova</label
          >
          <label
            ><input type="radio" value="RINNOVO" v-model="form.id_tipo" required />
            Rinnovo</label
          >
        </div>

        <div class="header-group">
          <div class="form-group">
            <div style="align-items: flex-end">
              <label>Foto formato 33x40 mm</label>
              <div class="foto">
                <input
                  type="file"
                  @change="(e) => handleFile(e, 'foto')"
                  accept="image/*"
                  class="fileInput"
                />
                <img
                  v-if="previews.foto"
                  :src="previews.foto"
                  style="width: 100%; height: 100%; object-fit: cover"
                />
              </div>
            </div>
            <div class="form-group">
              <label>Firma</label>
              <div class="firma">
                <input
                  type="file"
                  @change="(e) => handleFile(e, 'firma')"
                  accept="image/*"
                  class="fileInput"
                />
                <img
                  v-if="previews.firma"
                  :src="previews.firma"
                  style="max-height: 90%; max-width: 90%"
                />
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Tipologia</label>
            <label class="radio-label"
              ><input type="radio" value="PCR" v-model="form.id_ente" required />
              Protezione Civile della Regione</label
            >
            <label class="radio-label"
              ><input type="radio" value="CFR" v-model="form.id_ente" required /> Corpo
              Forestale Regionale</label
            >
          </div>
        </div>

        <fieldset>
          <legend>DATI PERSONALI</legend>
          <div class="form-group-row">
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

          <div>
            <div class="form-group-row">
              <label>Codice Fiscale</label>
              <input
                :value="selectedPerson?.codice_fiscale"
                type="text"
                readonly
                style="background: #f0f0f0"
              />
            </div>
            <div>
              <div class="form-group-row">
                <label>Data di nascita</label>
                <input
                  :value="formatDate(selectedPerson?.data_nascita)"
                  type="text"
                  readonly
                  style="background: #f0f0f0"
                />
              </div>
              <div class="form-group-row">
                <label>Luogo di nascita</label>
                <input
                  :value="selectedPerson?.luogo_nascita"
                  type="text"
                  readonly
                  style="background: #f0f0f0"
                />
              </div>
            </div>
          </div>

          <div class="form-group-row">
            <label>Residenza</label>
            <input v-model="form.residenza_persona" type="text" required />
          </div>
          <div class="form-group-row">
            <label>Direzione / Servizio di appartenenza</label>
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
          <legend>DATI PATENTE CIVILE POSSEDUTA</legend>
          <div>
            <div class="form-group-row">
              <label>Numero della patente</label>
              <input v-model="form.patente_civile_numero" type="text" required />
            </div>
            <div class="form-group-row">
              <label>Categoria patente civile</label>
              <select v-model="form.patente_civile_categorie" required>
                <option disabled value="">Seleziona categoria...</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.id.replace("_", " ") }} - {{ cat.descrizione }}
                </option>
              </select>
            </div>
          </div>
          <div>
            <div class="form-group-row">
              <label>Rilasciata da</label>
              <input v-model="form.patente_civile_autorita" type="text" required />
            </div>
            <div class="form-group-row">
              <label>Data del rilascio</label>
              <input v-model="form.patente_civile_rilascio" type="date" required />
            </div>
            <div class="form-group-row">
              <label>Data di scadenza </label>
              <input v-model="form.patente_civile_scadenza" type="date" required />
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
                {{ formatDate(selectedRequest.persona?.data_nascita) }}
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
                <strong>Rilasciata da:</strong>
                {{ selectedRequest.persona?.patente_civile[0].autorita }}
              </p>
              <p>
                <strong>Data del rilascio:</strong>
                {{ formatDate(selectedRequest.persona?.patente_civile[0].data_rilascio) }}
              </p>
              <p>
                <strong>Data di scadenza:</strong>
                {{ formatDate(selectedRequest.persona?.patente_civile[0].data_scadenza) }}
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

    <Modal
      v-if="showDeleteModal"
      title="Conferma eliminazione"
      @close="showDeleteModal = false"
    >
      <div class="confirm-modal-content">
        <p>
          Sei sicuro di voler eliminare la richiesta di
          <strong>{{ requestToDelete?.persona?.cognome + " " + requestToDelete?.persona?.nome }}</strong
          >?
        </p>
        <div class="form-actions">
          <button @click="showDeleteModal = false" class="btn-cancel">Annulla</button>
          <button @click="executeDelete" class="btn-reject" :disabled="isSaving">
            Sì, elimina
          </button>
        </div>
      </div>
    </Modal>

    <div v-if="loading">Caricando...</div>
    <div v-else-if="error">{{ error }}</div>
    <Table v-else :items="filteredRichiesteRaw" :fields="columns">
      <template #cell[data_richiesta]="{ data }">
        {{ formatDate(data.item.data_richiesta) }}
      </template>

      <template #cell[titolare]="{ data }">
        {{ data.item.persona?.cognome }} {{ data.item.persona?.nome }}
      </template>

      <template #cell[ente.descrizione]="{ data }">
        {{ data.item.ente?.descrizione || "-" }}
      </template>

      <template #cell[tipo.descrizione]="{ data }">
        {{ data.item.tipo?.descrizione || "-" }}
      </template>

      <template #cell[id_stato]="{ data }">
        <span :class="['badge', data.item.id_stato]">
          {{ data.item.stato?.descrizione || data.item.id_stato }}
        </span>
      </template>

      <template #cell[foto]="{ data }">
        <div class="images-container">
          <template v-if="data.item.fototessera">
            <img
              :src="`api/${data.item.fototessera.path}`"
              class="thumbnail"
              title="Foto"
            />
            <img
              :src="`api/${data.item.firma_scansionata?.path}`"
              class="thumbnail"
              title="Firma"
            />
          </template>
          <Icon v-else name="account_circle" color="#ccc" size="30" />
        </div>
      </template>

      <template #cell[actions]="{ data }">
        <div class="actions-wrapper">
          <button
            class="btn-icon details"
            @click="viewDetails(data.item)"
            title="Dettagli"
          >
            <Icon name="visibility" size="24" />
          </button>

          <template v-if="data.item.id_stato === 'IN_PREPARAZIONE'">
            <button
              class="btn-icon edit"
              @click="openEditModal(data.item)"
              title="Modifica"
            >
              <Icon name="edit" size="24" />
            </button>
            <button
              class="btn-icon delete"
              @click="confirmDelete(data.item)"
              title="Elimina"
            >
              <Icon name="delete" size="24" />
            </button>
          </template>
        </div>
      </template>
    </Table>
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
import Table from "@/components/Table.vue";
import Modal from "@/components/Modal.vue";
import Toast from "@/components/Toast.vue";
import Icon from "@/components/Icon.vue";
import SearchBar from "@/components/SearchBar.vue";
import Filter from "@/components/Filter.vue";
import { formatDate } from "@/utils/formatters";

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
const isEditing = ref(false);
const showDeleteModal = ref(false);
const requestToDelete = ref(null);

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
  patente_civile_autorita: "",
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

const selectedPerson = computed(() => {
  if (!form.value.id_persona) return null;
  return people.value.find((p) => p.id === form.value.id_persona);
});

const previews = ref({ foto: null, firma: null });
const handleFile = (e, type) => {
  const file = e.target.files[0];
  if (file) {
    files[type] = file;
    previews.value[type] = URL.createObjectURL(file);
  }
};

const files = { foto: null, firma: null };

const columns = [
  { key: "data_richiesta", label: "Data", sortable: true },
  { key: "titolare", label: "Richiedente", sortable: true },
  { key: "ente.descrizione", label: "Ente", sortable: true },
  { key: "tipo.descrizione", label: "Tipo" },
  { key: "id_stato", label: "Stato", sortable: true },
  { key: "foto", label: "Allegati" },
  { key: "actions", label: "Azioni" },
];

const statusOptions = [
  { value: "IN_PREPARAZIONE", label: "In preparazione" },
  { value: "INVIATA", label: "Inviata" },
  { value: "RESPINTA", label: "Respinta" },
];

const filteredRichiesteRaw = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  let result = [...richieste.value];

  if (statusFilter.value !== "ALL") {
    result = result.filter((r) => r.id_stato === statusFilter.value);
  }

  if (query) {
    result = result.filter(
      (r) =>
        r.persona?.cognome?.toLowerCase().includes(query) ||
        r.persona?.nome?.toLowerCase().includes(query) ||
        r.persona?.codice_fiscale?.toLowerCase().includes(query)
    );
  }

  return result.sort((a, b) => {
    const dateA = new Date(a.data_richiesta);
    const dateB = new Date(b.data_richiesta);
    return sortOrder.value === "ASC" ? dateA - dateB : dateB - dateA;
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

const openEditModal = (item) => {
  isEditing.value = true;
  const r = item;

  form.value = {
    ...initialFormState,
    id: r.id,
    id_persona: r.id_persona,
    id_ente: r.id_ente,
    id_tipo: r.id_tipo,
    residenza_persona: r.residenza_persona,
    patente_civile_numero: r.persona?.patente_civile[0]?.numero || "",
    patente_civile_categorie: r.persona?.patente_civile[0]?.id_categoria || "",
    patente_civile_autorita: r.persona?.patente_civile[0]?.autorita || "",
    patente_civile_rilascio: r.persona?.patente_civile[0]?.data_rilascio || "",
    patente_civile_scadenza: r.persona?.patente_civile[0]?.data_scadenza || "",
  };

  previews.value.foto = r.fototessera ? `api/${r.fototessera.path}` : null;
  previews.value.firma = r.firma_scansionata ? `api/${r.firma_scansionata.path}` : null;

  showModal.value = true;
};

const openCreateModal = () => {
  isEditing.value = false;
  resetForm();
  showModal.value = true;
};

const submitRequest = async () => {
  try {
    isSaving.value = true;
    const formData = new FormData();

    Object.keys(form.value).forEach((key) => formData.append(key, form.value[key]));
    if (files.foto) formData.append("fototessera", files.foto);
    if (files.firma) formData.append("firma", files.firma);

    if (isEditing.value) {
      await apiClient.patch(`/richieste/${form.value.id}`, formData);
    } else {
      await apiClient.post("/richieste", formData);
    }

    showModal.value = false;
    resetForm();
    await loadData();
    showToast(isEditing.value ? "Richiesta aggiornata!" : "Richiesta salvata!");
  } catch (err) {
    showToast("Errore: " + err.message, "error");
  } finally {
    isSaving.value = false;
  }
};

const confirmDelete = (item) => {
  requestToDelete.value = item.raw;
  showDeleteModal.value = true;
};

const executeDelete = async () => {
  try {
    isSaving.value = true;
    await apiClient.delete(`/richieste/${requestToDelete.value.id}`);
    showToast("Richiesta eliminata");
    await loadData();
    showDeleteModal.value = false;
  } catch (err) {
    showToast(err.response?.data?.error || "Errore", "error");
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
  if (previews.value.foto) URL.revokeObjectURL(previews.value.foto);
  if (previews.value.firma) URL.revokeObjectURL(previews.value.firma);

  form.value = { ...initialFormState };
  files.foto = null;
  files.firma = null;
  previews.value = { foto: null, firma: null };
};

const printLicense = async (item) => {
  let url = null;
  try {
    await apiClient.post(`/richieste/${item.id}`);

    showToast("Richiesta approvata. Generazione PDF...");

    await new Promise((resolve) => setTimeout(resolve, 500));

    const response = await apiClient.get(`/richieste/${item.id}/pdf`, {
      responseType: "blob",
    });

    const blob = new Blob([response], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    const printWindow = window.open(url);
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } else {
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Patente_${item.cognome}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    await loadData();
  } catch (err) {
    if (url) window.URL.revokeObjectURL(url);
    console.error("Errore durante el proceso:", err);
    const msg =
      err.response?.data?.error || "Errore durante la generazione del documento";
    showToast(msg, "error");
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

.flex {
  display: flex;
  align-items: center;
}
.firma {
  width: 300px;
  height: 100px;
  border: 1px solid black;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}
.foto {
  width: 132px;
  height: 160px;
  border: 1px solid black;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
  background: #f9f9f9;
}
.fileInput {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
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
.header-group {
  display: flex;
}
.form-group-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 5px;
  font-weight: bold;
  font-size: 0.9rem;
  color: #555;
}
.form-group-row input,
.form-group-row select {
  flex: 1;
  min-width: 0;
}

.form-group-row label {
  white-space: nowrap;
  margin-right: 15px;
  display: flex;
  align-items: center;
}

.form-group-row {
  margin-bottom: 10px;
  align-items: center;
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

  &:disabled {
    background: #ccc;
  }
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

  &:hover {
    background-color: #c82333;
  }
}

.option-add {
  background-color: #f0f7ff;
  color: #0067b1;
  font-weight: bold;
}

.images-container {
  display: flex;
  gap: 4px;
  justify-content: center;
}
.thumbnail {
  width: 30px;
  height: 38px;
  object-fit: cover;
  border: 1px solid #ddd;
  border-radius: 2px;
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
.btn-icon.reject {
  color: #dc3545;
}
.btn-icon.edit {
  color: #0067b1;
}
.btn-icon.delete {
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

.toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}
</style>
