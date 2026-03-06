<script setup lang="ts">
import Avatar from "primevue/avatar";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Tag from "primevue/tag";

type Period = "Weekly" | "Monthly" | "Yearly";

interface AnalyticsPoint {
  month: string;
  personal: number;
  corporate: number;
  investment: number;
}

interface TransactionRow {
  id: string;
  name: string;
  initials: string;
  coin: "BTC" | "ETH" | "SOL";
  date: string;
  process: "Buy" | "Sell" | "Hold";
  amount: string;
}

const search = ref("");
const periodOptions: Period[] = ["Weekly", "Monthly", "Yearly"];
const selectedPeriod = ref<Period>("Monthly");

const seriesByPeriod: Record<Period, AnalyticsPoint[]> = {
  Weekly: [
    { month: "Mon", personal: 4000, corporate: 2100, investment: 1600 },
    { month: "Tue", personal: 6200, corporate: 2500, investment: 1800 },
    { month: "Wed", personal: 5300, corporate: 2600, investment: 1700 },
    { month: "Thu", personal: 7900, corporate: 3100, investment: 2100 },
    { month: "Fri", personal: 8700, corporate: 3400, investment: 2300 },
    { month: "Sat", personal: 6500, corporate: 2900, investment: 2200 },
    { month: "Sun", personal: 5100, corporate: 2400, investment: 1900 }
  ],
  Monthly: [
    { month: "Jan", personal: 4000, corporate: 2100, investment: 4100 },
    { month: "Feb", personal: 10000, corporate: 8200, investment: 5100 },
    { month: "Mar", personal: 15200, corporate: 1600, investment: 2800 },
    { month: "Apr", personal: 3900, corporate: 7600, investment: 7200 },
    { month: "May", personal: 16100, corporate: 3300, investment: 2200 },
    { month: "Jun", personal: 8100, corporate: 6400, investment: 3900 },
    { month: "Jul", personal: 12100, corporate: 7200, investment: 7600 },
    { month: "Aug", personal: 14100, corporate: 7900, investment: 7700 },
    { month: "Sep", personal: 17100, corporate: 4600, investment: 4800 },
    { month: "Oct", personal: 5100, corporate: 9100, investment: 8700 },
    { month: "Nov", personal: 12200, corporate: 7300, investment: 7800 },
    { month: "Dec", personal: 6100, corporate: 4100, investment: 3900 }
  ],
  Yearly: [
    { month: "2021", personal: 42000, corporate: 32000, investment: 19000 },
    { month: "2022", personal: 61000, corporate: 37000, investment: 26000 },
    { month: "2023", personal: 58000, corporate: 43000, investment: 33000 },
    { month: "2024", personal: 77000, corporate: 45000, investment: 39000 }
  ]
};

const chartData = computed(() => seriesByPeriod[selectedPeriod.value]);

const maxValue = computed(() => {
  return Math.max(...chartData.value.map((point) => point.personal + point.corporate + point.investment));
});

const toPercent = (value: number) => `${Math.round((value / maxValue.value) * 100)}%`;

const transactions = ref<TransactionRow[]>([
  {
    id: "#1254",
    name: "Amy Yelsner",
    initials: "AY",
    coin: "ETH",
    date: "May 5th",
    process: "Buy",
    amount: "3.005 BTC"
  },
  {
    id: "#1255",
    name: "Dianne Russell",
    initials: "DR",
    coin: "BTC",
    date: "May 7th",
    process: "Sell",
    amount: "1.305 BTC"
  },
  {
    id: "#1256",
    name: "Guy Hawkins",
    initials: "GH",
    coin: "SOL",
    date: "May 9th",
    process: "Hold",
    amount: "0.857 BTC"
  }
]);

const filteredTransactions = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) {
    return transactions.value;
  }

  return transactions.value.filter((transaction) => {
    return transaction.name.toLowerCase().includes(q) || transaction.id.toLowerCase().includes(q);
  });
});

const walletRows = [
  { symbol: "BTC", percent: 15, value: "27.215", color: "#d4971f" },
  { symbol: "ETH", percent: 20, value: "18.990", color: "#2ea76f" },
  { symbol: "SOL", percent: 25, value: "11.344", color: "#1eb6b8" },
  { symbol: "ADA", percent: 40, value: "9.308", color: "#f0ba16" }
];
</script>

<template>
  <section class="pv-page overview-page">
    <header class="overview-header">
      <div>
        <p class="overview-kicker">Overview</p>
        <h1>Welcome to PrimeVue</h1>
      </div>

      <div class="overview-header-actions">
        <span class="search-wrap compact">
          <i class="pi pi-search" />
          <InputText v-model="search" placeholder="Search" />
        </span>
        <Button text rounded severity="secondary" icon="pi pi-bell">
          <span class="notify-dot" />
        </Button>
      </div>
    </header>

    <section class="overview-toolbar">
      <div class="segment-control">
        <Button
          v-for="option in periodOptions"
          :key="option"
          rounded
          size="small"
          :label="option"
          :text="selectedPeriod !== option"
          :severity="selectedPeriod === option ? undefined : 'secondary'"
          @click="selectedPeriod = option"
        />
      </div>

      <div class="toolbar-right">
        <Button label="Download" icon="pi pi-download" />
        <Button label="06/11/2024 - 06/22/2024" severity="secondary" outlined icon="pi pi-calendar" />
      </div>
    </section>

    <article class="panel analytics-panel">
      <header>
        <h2>Crypto Analytics</h2>
        <div class="legend-row">
          <span><i class="legend-dot personal" /> Personal Wallet</span>
          <span><i class="legend-dot corporate" /> Corporate Wallet</span>
          <span><i class="legend-dot investment" /> Investment Wallet</span>
        </div>
      </header>

      <div class="chart-wrap" :class="{ yearly: selectedPeriod === 'Yearly' }">
        <div class="chart-grid-lines">
          <span v-for="n in 6" :key="n" />
        </div>

        <div class="bar-groups">
          <div v-for="point in chartData" :key="point.month" class="bar-group">
            <div class="bar-stack">
              <span class="segment personal" :style="{ height: toPercent(point.personal) }" />
              <span class="segment corporate" :style="{ height: toPercent(point.corporate) }" />
              <span class="segment investment" :style="{ height: toPercent(point.investment) }" />
            </div>
            <small>{{ point.month }}</small>
          </div>
        </div>
      </div>
    </article>

    <section class="overview-bottom-grid">
      <article class="panel">
        <header class="panel-head">
          <h2>Transactions</h2>
          <Button text rounded severity="secondary" icon="pi pi-ellipsis-h" />
        </header>

        <div class="tx-table-wrap">
          <table class="tx-table">
            <thead>
              <tr>
                <th>Id</th>
                <th>Name</th>
                <th>Coin</th>
                <th>Date</th>
                <th>Process</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in filteredTransactions" :key="row.id">
                <td>{{ row.id }}</td>
                <td>
                  <div class="name-cell">
                    <Avatar :label="row.initials" shape="circle" />
                    <span>{{ row.name }}</span>
                  </div>
                </td>
                <td>
                  <Tag :value="row.coin" severity="secondary" rounded />
                </td>
                <td>{{ row.date }}</td>
                <td>
                  <Tag
                    :value="row.process"
                    :severity="row.process === 'Buy' ? 'success' : row.process === 'Sell' ? 'danger' : 'info'"
                  />
                </td>
                <td>{{ row.amount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="panel wallet-panel">
        <header class="panel-head">
          <h2>My Wallet</h2>
          <Button text rounded severity="secondary" icon="pi pi-ellipsis-h" />
        </header>

        <div class="wallet-track">
          <span v-for="item in walletRows" :key="item.symbol" :style="{ width: `${item.percent}%`, background: item.color }" />
        </div>

        <ul class="wallet-list">
          <li v-for="item in walletRows" :key="item.symbol">
            <span class="coin-cell">
              <i :style="{ background: item.color }" /> {{ item.symbol }} ({{ item.percent }}%)
            </span>
            <strong>{{ item.value }}</strong>
          </li>
        </ul>
      </article>
    </section>
  </section>
</template>
