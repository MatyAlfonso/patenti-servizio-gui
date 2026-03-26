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

    <RequestFormModal
      v-model="showModal"
      :edit-data="selectedRequest"
      :people="people"
      :categories="categories"
      @saved="handleSaved"
      @refresh-people="loadPeople"
    />

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
            @click="confirmReject(selectedRequest)"
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
          <strong>{{
            requestToDelete?.persona?.cognome + " " + requestToDelete?.persona?.nome
          }}</strong
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

    <Modal
      v-if="showRejectModal"
      title="Conferma respinta"
      @close="showRejectModal = false"
    >
      <div class="confirm-modal-content">
        <p>
          Sei sicuro di voler respingere la richiesta di
          <strong>{{
            requestToReject?.persona?.cognome + " " + requestToReject?.persona?.nome
          }}</strong
          >?
        </p>
        <div class="form-actions">
          <button @click="showRejectModal = false" class="btn-cancel">Annulla</button>
          <button @click="executeReject" class="btn-reject" :disabled="isSaving">
            Sì, respingi
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
          <Icon v-else name="photo" color="#ccc" size="30" />
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
import RequestFormModal from "@/components/RequestFormModal.vue";
import { formatDate } from "@/utils/formatters";

const showModal = ref(false);
const showDetailModal = ref(false);
const selectedRequest = ref(null);
const loading = ref(true);
const isSaving = ref(false);
const error = ref(null);
const searchQuery = ref("");
const statusFilter = ref("ALL");
const sortOrder = ref("DESC");
const showDeleteModal = ref(false);
const showRejectModal = ref(false);
const requestToDelete = ref(null);
const requestToReject = ref(null);

const richieste = ref([]);
const people = ref([]);
const entities = ref([]);
const categories = ref([]);
const requestTypes = ref([]);

const toast = ref({
  show: false,
  message: "",
  type: "success",
});

const createSort = (path, isDate = false) => {
  return (fa, fb, a, b) => {
    const getValue = (obj) =>
      path.split(".").reduce((acc, part) => acc?.[part], obj) || "";

    const valA = getValue(a);
    const valB = getValue(b);

    if (isDate) {
      return new Date(valA) - new Date(valB);
    }

    return String(valA).localeCompare(String(valB), undefined, { sensitivity: "base" });
  };
};

const columns = [
  { key: "data_richiesta", label: "Data", sortable: true },
  {
    key: "titolare",
    label: "Richiedente",
    sortable: true,
    sort: (fa, fb, a, b) => {
      const nameA = `${a.persona?.cognome} ${a.persona?.nome}`.toLowerCase();
      const nameB = `${b.persona?.cognome} ${b.persona?.nome}`.toLowerCase();
      return nameA.localeCompare(nameB);
    },
  },
  {
    key: "ente.descrizione",
    label: "Ente",
    sortable: true,
    sort: createSort("ente.descrizione"),
  },
  {
    key: "tipo.descrizione",
    label: "Tipo",
    sortable: true,
    sort: createSort("tipo.descrizione"),
  },
  {
    key: "id_stato",
    label: "Stato",
    sortable: true,
    sort: createSort("stato.descrizione"),
  },
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

const handleSaved = async () => {
  await loadData();
  showToast(
    selectedRequest.value
      ? "Richiesta modificata con successo"
      : "Richiesta creata con successo"
  );
};

const showToast = (msg, type = "success") => {
  toast.value = { show: true, message: msg, type };
  setTimeout(() => {
    toast.value.show = false;
  }, 4000);
};

const openEditModal = (item) => {
  selectedRequest.value = item;
  showModal.value = true;
};

const openCreateModal = () => {
  selectedRequest.value = null;
  showModal.value = true;
};

const confirmDelete = (item) => {
  requestToDelete.value = item;
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
    console.error("Errore durante il proceso:", err);
    const msg =
      err.response?.data?.error || "Errore durante la generazione del documento";
    showToast(msg, "error");
  }
};

const confirmReject = (item) => {
  requestToReject.value = item;
  showRejectModal.value = true;
};

const executeReject = async () => {
  try {
    await apiClient.patch(`/richieste/${requestToReject.value.id}`, {
      id_stato: "RESPINTA",
    });

    showToast("Richiesta respinta correctamente");
    showDetailModal.value = false;
    await loadData();
    showRejectModal.value = false;
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
