<template>
  <div class="table-container">
    <table class="generic-table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
          <th v-if="$slots.actions">Azioni</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in items" :key="item.id || index">
          <td v-for="col in columns" :key="col.key">
            <slot :name="'cell-' + col.key" :item="item">
              {{ item[col.key] }}
            </slot>
          </td>
          <td v-if="$slots.actions">
            <slot name="actions" :item="item"></slot>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="items.length === 0" class="no-data">Nessun dato disponibile.</div>
  </div>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
    default: () => [],
  },
  columns: {
    type: Array,
    required: true,
  },
});
</script>

<style scoped>
.table-container {
  width: 100%;
  overflow-x: auto;
}

.generic-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.generic-table th,
.generic-table td {
  border: 1px solid #ddd;
  padding: 12px 8px;
  text-align: left;
}

.generic-table th {
  background-color: #f4f4f4;
  font-weight: bold;
  color: #333;
}

.generic-table tr:hover {
  background-color: #f9f9f9;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #666;
}
</style>
