<template>
  <div class="page-container">
    <div class="header-section">
      <h2>Gestione patenti</h2>

      <div class="toolbar">
        <SearchBar v-model="searchQuery" placeholder="Cerca per nome o cognome..." />
        <Filter
          v-model:statusFilter="statusFilter"
          v-model:sortOrder="sortOrder"
          :options="statusOptions"
        />
      </div>

      <div class="tabs">
        <button
          :class="['tab-btn', { active: activeTab === 'servizio' }]"
          @click="activeTab = 'servizio'"
        >
          Patenti di servizio
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'civile' }]"
          @click="activeTab = 'civile'"
        >
          Patenti civili
        </button>
      </div>
    </div>

    <div class="tab-content">
      <Table
        :items="activeTab === 'servizio' ? filteredServizioRaw : filteredCivileRaw"
        :fields="activeTab === 'servizio' ? colsServizio : colsCivile"
      >
        <template #cell[titolare]="{ data }">
          {{ data.item.persona?.cognome }} {{ data.item.persona?.nome }}
        </template>

        <template #cell[data_scadenza]="{ data }">
          <template v-if="activeTab === 'servizio'">
            {{ formatDate(data.item.patente_civile?.data_scadenza) || "-" }}
          </template>
          <template v-else>
            {{ formatDate(data.item.data_scadenza) || "-" }}
          </template>
        </template>

        <template #cell[id_stato]="{ data }">
          <span :class="['badge', data.item.id_stato]">
            {{ data.item.stato?.descrizione || data.item.id_stato }}
          </span>
        </template>

        <template #cell[actions]="{ data }">
          <div class="action-buttons">
            <button
              class="btn-icon print"
              @click="openStatusModal(data.item, activeTab)"
              title="Cambia stato"
            >
              <Icon name="settings" size="24" />
            </button>
          </div>
        </template>
      </Table>
    </div>

    <Modal
      v-if="statusModal.show"
      :title="statusModal.title"
      @close="statusModal.show = false"
    >
      <div class="status-change-form">
        <p>
          Stai cambiando lo stato della patente
          {{ activeTab === "servizio" ? "di Servizio" : "Civile" }} di
          <strong>{{ statusModal.targetName }}</strong>
        </p>
        <div class="form-group">
          <label>Seleziona nuovo stato:</label>
          <select v-model="statusModal.newState">
            <option v-if="activeTab === 'servizio'" value="ANNULLATA">Annullata</option>
            <option value="ATTIVA">Attiva</option>
            <option v-if="activeTab === 'servizio'" value="IN_PREPARAZIONE">
              In preparazione
            </option>
            <option value="REVOCATA">Revocata</option>
            <option value="SCADUTA">Scaduta</option>
            <option value="RUBATA">Rubata</option>
            <option value="SMARRITA">Smarrita</option>
            <option value="SOSPESA">Sospesa</option>
          </select>
        </div>
        <div class="form-actions">
          <button @click="statusModal.show = false" class="btn-cancel">Annulla</button>
          <button @click="confirmStatusChange" class="btn-save">Conferma cambio</button>
        </div>
      </div>
    </Modal>

    <Toast
      v-if="toast.show"
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
import Icon from "@/components/Icon.vue";
import Toast from "@/components/Toast.vue";
import SearchBar from "@/components/SearchBar.vue";
import Filter from "@/components/Filter.vue";
import { formatDate } from "@/utils/formatters";

const activeTab = ref("servizio");
const patentiServizio = ref([]);
const patentiCivile = ref([]);
const toast = ref({ show: false, message: "", type: "success" });
const searchQuery = ref("");
const statusFilter = ref("ALL");
const sortOrder = ref("DESC");

const statusModal = ref({
  show: false,
  title: "Gestione stato patente",
  targetId: null,
  targetName: "",
  newState: "",
});

const colsServizio = [
  { key: "numero", label: "Numero", sortable: true },
  { key: "titolare", label: "Titolare", sortable: true },
  { key: "id_ente", label: "Ente", sortable: true },
  { key: "id_categoria", label: "Categoria", sortable: true },
  { key: "data_rilascio", label: "Rilascio", sortable: true, formatter: formatDate },
  { key: "data_scadenza", label: "Scadenza", sortable: true, formatter: formatDate },
  { key: "id_stato", label: "Stato", sortable: true },
  { key: "actions", label: "Azioni" },
];

const colsCivile = [
  { key: "numero", label: "Numero", sortable: true },
  { key: "titolare", label: "Titolare", sortable: true },
  { key: "data_rilascio", label: "Rilascio", sortable: true, formatter: formatDate },
  { key: "data_scadenza", label: "Scadenza", sortable: true, formatter: formatDate },
  { key: "id_stato", label: "Stato", sortable: true },
  { key: "actions", label: "Azioni" },
];

const statusOptions = computed(() => {
  if (activeTab.value === "servizio") {
    return [
      { value: "ATTIVA", label: "Attiva" },
      { value: "IN_PREPARAZIONE", label: "In preparazione" },
      { value: "ANNULLATA", label: "Annullata" },
      { value: "REVOCATA", label: "Revocata" },
      { value: "SCADUTA", label: "Scaduta" },
      { value: "RUBATA", label: "Rubata" },
      { value: "SMARRITA", label: "Smarrita" },
      { value: "SOSPESA", label: "Sospesa" },
    ];
  } else {
    return [
      { value: "ATTIVA", label: "Attiva" },
      { value: "REVOCATA", label: "Revocata" },
      { value: "SCADUTA", label: "Scaduta" },
      { value: "RUBATA", label: "Rubata" },
      { value: "SMARRITA", label: "Smarrita" },
      { value: "SOSPESA", label: "Sospesa" },
    ];
  }
});

const filteredServizioRaw = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  let result = [...patentiServizio.value];
  if (query) {
    result = result.filter((p) =>
      `${p.persona?.nome} ${p.persona?.cognome}`.toLowerCase().includes(query)
    );
  }
  if (statusFilter.value !== "ALL") {
    result = result.filter((p) => p.id_stato === statusFilter.value);
  }
  return result;
});

const filteredCivileRaw = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  let result = [...patentiCivile.value];
  if (query) {
    result = result.filter(
      (p) =>
        p.numero?.toLowerCase().includes(query) ||
        `${p.persona?.nome} ${p.persona?.cognome}`.toLowerCase().includes(query)
    );
  }
  if (statusFilter.value !== "ALL") {
    result = result.filter((p) => p.id_stato === statusFilter.value);
  }
  return result;
});

const loadData = async () => {
  try {
    const [resServ, resCiv] = await Promise.all([
      apiClient.get("/patenti-servizio"),
      apiClient.get("/patenti-civili"),
    ]);
    patentiServizio.value = resServ;
    patentiCivile.value = resCiv;
  } catch (e) {
    showToast("Errore nel caricamento", "error");
  }
};

const openStatusModal = (patente, tipo) => {
  statusModal.value = {
    show: true,
    title: `Gestione patente ${tipo === "servizio" ? "di servizio" : "Civile"}`,
    targetId: patente.id,
    targetName: `${patente.persona?.cognome} ${patente.persona?.nome}`,
    newState: patente.id_stato,
  };
};

const confirmStatusChange = async () => {
  try {
    const endpoint =
      activeTab.value === "servizio"
        ? `/patenti-servizio/${statusModal.value.targetId}`
        : `/patenti-civili/${statusModal.value.targetId}`;

    await apiClient.patch(endpoint, {
      id_stato: statusModal.value.newState,
    });

    showToast("Stato aggiornato con successo");
    statusModal.value.show = false;
    await loadData();
  } catch (e) {
    showToast(e.message, "error");
  }
};

const showToast = (msg, type = "success") => {
  toast.value = { show: true, message: msg, type };
  setTimeout(() => (toast.value.show = false), 3000);
};

onMounted(loadData);
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.tab-btn {
  padding: 10px 20px;
  border: none;
  background: #eee;
  cursor: pointer;
  border-radius: 4px 4px 0 0;
  font-weight: bold;
}
.tab-btn.active {
  background: #0067b1;
  color: white;
}
.status-select-mini {
  padding: 4px;
  font-size: 0.85rem;
  border-radius: 4px;
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
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}
.btn-icon.warning {
  color: #ff9800;
}
.btn-icon.print {
  color: #0067b1;
}
.status-change-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
.badge.ATTIVA {
  background: #d4edda;
  color: #155724;
}
.badge.REVOCATA,
.badge.SCADUTA,
.badge.SOSPESA,
.badge.ANNULLATA,
.badge.RUBATA,
.badge.SMARRITA {
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
</style>
