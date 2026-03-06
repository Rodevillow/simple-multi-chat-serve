<script setup lang="ts">
import Avatar from "primevue/avatar";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import InputText from "primevue/inputtext";
import Tag from "primevue/tag";

type CustomerStatus = "Active" | "Inactive" | "Prospect";

interface CustomerRow {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  title: string;
  company: string;
  email: string;
  source: string;
  status: CustomerStatus;
  online?: "green" | "red" | "dark";
}

const query = ref("");
const page = ref(1);
const pageSize = 8;
const selected = ref<string[]>([]);

const rows = ref<CustomerRow[]>([
  {
    id: "1",
    name: "Brook Simmons",
    initials: "BS",
    avatar: "https://i.pravatar.cc/120?img=12",
    title: "Sales Executive",
    company: "Mistranet",
    email: "hi@brooksmmns.co",
    source: "Linkedin",
    status: "Active",
    online: "green"
  },
  {
    id: "2",
    name: "Dianne Russell",
    initials: "DR",
    avatar: "https://i.pravatar.cc/120?img=24",
    title: "CEO",
    company: "BriteMank",
    email: "hi@diannerussell.com",
    source: "Website",
    status: "Inactive",
    online: "green"
  },
  {
    id: "3",
    name: "Amy Elsner",
    initials: "AE",
    avatar: "https://i.pravatar.cc/120?img=28",
    title: "Product Manager",
    company: "ZenTrailMs",
    email: "hi@amyelsner.com",
    source: "Cold Call",
    status: "Prospect",
    online: "dark"
  },
  {
    id: "4",
    name: "Jacob Jones",
    initials: "JJ",
    avatar: "https://i.pravatar.cc/120?img=11",
    title: "Manager",
    company: "Streamlinz",
    email: "jacobjones@gmail.com",
    source: "Partner",
    status: "Prospect",
    online: "green"
  },
  {
    id: "5",
    name: "Cameron Watson",
    initials: "CW",
    title: "Product Manager",
    company: "BriteMank",
    email: "hi@cameronwilliamson",
    source: "Social Media",
    status: "Active",
    online: "red"
  },
  {
    id: "6",
    name: "Wade Warren",
    initials: "WW",
    title: "Director",
    company: "Streamlinz",
    email: "hi@annetteblack.com",
    source: "Cold Call",
    status: "Inactive",
    online: "green"
  },
  {
    id: "7",
    name: "Guy Hawkins",
    initials: "GH",
    avatar: "https://i.pravatar.cc/120?img=18",
    title: "Director",
    company: "Wavelength",
    email: "hi@darrellsteward.com",
    source: "Linkedin",
    status: "Active",
    online: "green"
  },
  {
    id: "8",
    name: "Annette Black",
    initials: "AB",
    avatar: "https://i.pravatar.cc/120?img=35",
    title: "Manager",
    company: "Wavelength",
    email: "jeromebell@gmail.com",
    source: "Website",
    status: "Inactive",
    online: "green"
  },
  {
    id: "9",
    name: "Robert Fox",
    initials: "RF",
    avatar: "https://i.pravatar.cc/120?img=40",
    title: "Support Lead",
    company: "PrimeTek",
    email: "robert@primetek.com",
    source: "Website",
    status: "Active",
    online: "green"
  }
]);

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) {
    return rows.value;
  }

  return rows.value.filter((row) => {
    return (
      row.name.toLowerCase().includes(q) ||
      row.company.toLowerCase().includes(q) ||
      row.email.toLowerCase().includes(q)
    );
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)));

watch(totalPages, (next) => {
  if (page.value > next) {
    page.value = next;
  }
});

const visibleRows = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filtered.value.slice(start, start + pageSize);
});

const allVisibleSelected = computed(() => {
  if (!visibleRows.value.length) {
    return false;
  }

  return visibleRows.value.every((row) => selected.value.includes(row.id));
});

const toggleAllVisible = () => {
  if (allVisibleSelected.value) {
    selected.value = selected.value.filter((id) => !visibleRows.value.some((row) => row.id === id));
    return;
  }

  selected.value = [...new Set([...selected.value, ...visibleRows.value.map((row) => row.id)])];
};

const goNext = () => {
  if (page.value < totalPages.value) {
    page.value += 1;
  }
};

const goPrev = () => {
  if (page.value > 1) {
    page.value -= 1;
  }
};

const statusSeverity = (status: CustomerStatus) => {
  if (status === "Active") {
    return "success";
  }

  if (status === "Inactive") {
    return "danger";
  }

  return "info";
};
</script>

<template>
  <section class="pv-page customers-page">
    <header class="customers-head">
      <div>
        <h1>Customers</h1>
        <p>The analysis list here shows all users</p>
      </div>
      <Tag value="950 Active User" severity="success" icon="pi pi-circle-fill" rounded />
    </header>

    <section class="panel customers-panel">
      <header class="customers-toolbar">
        <span class="search-wrap compact">
          <i class="pi pi-search" />
          <InputText v-model="query" placeholder="Search" />
        </span>

        <div class="toolbar-right">
          <Button text rounded severity="secondary" icon="pi pi-filter" />
          <Button text rounded severity="secondary" icon="pi pi-refresh" />
          <div class="pager-pill">{{ page }} of {{ totalPages }}</div>
          <Button text rounded severity="secondary" icon="pi pi-angle-left" @click="goPrev" />
          <Button text rounded severity="secondary" icon="pi pi-angle-right" @click="goNext" />
        </div>
      </header>

      <div class="customers-table-wrap">
        <table class="customers-table">
          <thead>
            <tr>
              <th><Checkbox binary :model-value="allVisibleSelected" @update:model-value="toggleAllVisible" /></th>
              <th>Name</th>
              <th>Title</th>
              <th>Company Name</th>
              <th>Email Address</th>
              <th>Lead Source</th>
              <th>Status</th>
              <th>More</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in visibleRows" :key="row.id">
              <td><Checkbox v-model="selected" :value="row.id" /></td>
              <td>
                <div class="name-cell">
                  <span class="online-dot" :class="row.online" />
                  <Avatar v-if="row.avatar" :image="row.avatar" shape="circle" />
                  <Avatar v-else :label="row.initials" shape="circle" />
                  <strong>{{ row.name }}</strong>
                </div>
              </td>
              <td>{{ row.title }}</td>
              <td>
                <span class="company-cell"><i class="pi pi-compass" /> {{ row.company }}</span>
              </td>
              <td>{{ row.email }}</td>
              <td>{{ row.source }}</td>
              <td>
                <Tag :value="row.status" :severity="statusSeverity(row.status)" />
              </td>
              <td>
                <Button text rounded severity="secondary" icon="pi pi-search" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>
