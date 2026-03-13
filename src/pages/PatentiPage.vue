<template>
  <div class="page-container">
    <div class="header-section">
      <h2>Gestione patenti</h2>

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

    <div v-if="activeTab === 'servizio'" class="tab-content">
      <DataTable
        :items="formattedServizio"
        :columns="colsServizio"
        actionsHeader="Azioni documento"
      >
        <template #cell-stato="{ item }">
          <span :class="['badge', item.raw.id_stato]">
            {{ item.raw.stato?.descrizione }}
          </span>
        </template>

        <template #actions="{ item }">
          <div class="action-buttons">
            <button
              v-if="item.raw.id_stato === 'ATTIVA'"
              class="btn-icon warning"
              @click="openStatusModal(item.raw, 'servizio')"
              title="Cambia stato"
            >
              <Icon name="report_problem" size="24" />
            </button>
            <button class="btn-icon print" title="Stampa duplicato">
              <Icon name="print" size="24" />
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <div v-else class="tab-content">
      <DataTable
        :items="formattedCivile"
        :columns="colsCivile"
        actionsHeader="Aggiorna stato"
      >
        <template #cell-stato="{ item }">
          <span :class="['badge', item.raw.id_stato]">
            {{ item.raw.stato?.descrizione }}
          </span>
        </template>

        <template #actions="{ item }">
          <select
            :value="item.raw.id_stato"
            @change="(e) => updateCivileStatus(item.raw.id, e.target.value)"
            class="status-select-mini"
          >
            <option value="ATTIVA">Attiva</option>
            <option value="SCADUTA">Scaduta</option>
            <option value="SOSPESA">Sospesa</option>
            <option value="REVOCATA">Revocata</option>
          </select>
        </template>
      </DataTable>
    </div>

    <Modal
      v-if="statusModal.show"
      :title="statusModal.title"
      @close="statusModal.show = false"
    >
      <div class="status-change-form">
        <p>
          Stai cambiando lo stato della patente di
          <strong>{{ statusModal.targetName }}</strong>
        </p>
        <div class="form-group">
          <label>Seleziona nuovo stato:</label>
          <select v-model="statusModal.newState">
            <option value="RUBATA">Rubata</option>
            <option value="SMARRITA">Smarrita</option>
            <option value="REVOCATA">Revocata</option>
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
import DataTable from "@/components/DataTable.vue";
import Modal from "@/components/Modal.vue";
import Icon from "@/components/Icon.vue";
import Toast from "@/components/Toast.vue";

const activeTab = ref("servizio");
const patentiServizio = ref([]);
const patentiCivile = ref([]);
const toast = ref({ show: false, message: "", type: "success" });

const statusModal = ref({
  show: false,
  title: "Gestione stato patente",
  targetId: null,
  targetName: "",
  newState: "RUBATA",
});

const colsServizio = [
  { key: "numero", label: "Numero" },
  { key: "titolare", label: "Titolare" },
  { key: "ente", label: "Ente" },
  { key: "rilascio", label: "Data di rilascio" },
  { key: "scadenza", label: "Data di scadenza" },
  { key: "stato", label: "Stato" },
];

const colsCivile = [
  { key: "numero", label: "Numero" },
  { key: "titolare", label: "Titolare" },
  { key: "categoria", label: "Categoria" },
  { key: "rilascio", label: "Data di rilascio" },
  { key: "scadenza", label: "Data di scadenza" },
  { key: "stato", label: "Stato" },
];

const formattedServizio = computed(() =>
  patentiServizio.value.map((p) => ({
    id: p.id,
    numero: p.numero_patente,
    titolare: `${p.persona?.cognome} ${p.persona?.nome}`,
    ente: p.ente?.descrizione,
    rilascio: p.ente?.data_rilascio,
    scadenza: new Date(p.data_scadenza).toLocaleDateString(),
    raw: p,
  }))
);

const formattedCivile = computed(() =>
  patentiCivile.value.map((p) => ({
    id: p.id,
    titolare: `${p.persona?.cognome} ${p.persona?.nome}`,
    numero: p.numero,
    categoria: p.categoria?.id,
    rilascio: p.ente?.data_rilascio,
    scadenza: new Date(p.data_scadenza).toLocaleDateString(),
    raw: p,
  }))
);

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

const updateCivileStatus = async (id, nuevoStato) => {
  if (
    !confirm(
      `Cambiare lo stato della patente civile? Questo potrebbe disabilitare la patente di servizio collegata.`
    )
  )
    return;
  try {
    await apiClient.patch(`/patenti-civili/${id}`, { id_stato: nuevoStato });
    showToast("Stato aggiornato con successo");
    await loadData();
  } catch (e) {
    showToast(e.message, "error");
  }
};

const openStatusModal = (patente, tipo) => {
  statusModal.value = {
    show: true,
    title: `Gestione patente ${tipo === "servizio" ? "di servizio" : "Civile"}`,
    targetId: patente.id,
    targetName: `${patente.persona?.cognome} ${patente.persona?.nome}`,
    newState: "RUBATA",
  };
};

const confirmStatusChange = async () => {
  try {
    await apiClient.patch(`/patenti-servizio/${statusModal.value.targetId}`, {
      id_stato: statusModal.value.newState,
    });
    showToast("Patente aggiornata");
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
