<script setup lang="ts">
import Avatar from "primevue/avatar";
import Button from "primevue/button";
import Chip from "primevue/chip";
import InputText from "primevue/inputtext";
import ToggleSwitch from "primevue/toggleswitch";
import { useToast } from "primevue/usetoast";

const toast = useToast();
const profileMode = ref<"Chilling" | "Do Not Disturb">("Chilling");
const joinTab = ref<"Joined" | "Hosted">("Joined");
const fileInput = ref<HTMLInputElement | null>(null);
const uploadTitle = ref("Aura Theme");
const selectedFiles = ref<File[]>([]);
const tags = ref(["ui", "redesign", "dashboard"]);
const adminsOnly = ref(false);

const toggles = reactive({
  sound: true,
  wifi: true,
  darkMode: false,
  location: false,
  privacy: true,
  autoUpdate: false
});

const inviteRows = ref([
  { id: 1, name: "Jacob Jones", email: "hi@jacobjones.co", avatar: "https://i.pravatar.cc/120?img=11", joined: false },
  { id: 2, name: "Courtney Henry", email: "co.henry41@courtney.co", avatar: "https://i.pravatar.cc/120?img=26", joined: false }
]);

const addTagDraft = ref("");

const triggerPick = () => fileInput.value?.click();

const onPickFiles = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files ? [...target.files] : [];
  selectedFiles.value = files;
};

const addTag = () => {
  const next = addTagDraft.value.trim().toLowerCase();
  if (!next || tags.value.includes(next)) {
    addTagDraft.value = "";
    return;
  }

  tags.value = [...tags.value, next];
  addTagDraft.value = "";
};

const removeTag = (tag: string) => {
  tags.value = tags.value.filter((item) => item !== tag);
};

const toggleInvite = (id: number) => {
  inviteRows.value = inviteRows.value.map((row) => {
    if (row.id !== id) {
      return row;
    }

    return {
      ...row,
      joined: !row.joined
    };
  });
};

const submitUpload = () => {
  toast.add({
    severity: "success",
    summary: "Upload Prepared",
    detail: `${selectedFiles.value.length} file(s) attached for demo`,
    life: 1800
  });
};
</script>

<template>
  <section class="pv-page cards-page">
    <header class="cards-head">
      <h1>Cards</h1>
      <p>You can make cards using Aura like below 👇</p>
    </header>

    <div class="cards-grid">
      <section class="panel card-column">
        <article class="profile-card">
          <header>
            <Avatar image="https://i.pravatar.cc/120?img=11" shape="circle" size="xlarge" />
            <div>
              <h2>Jacob Jones</h2>
              <p>hi@jacobjones.co</p>
            </div>
          </header>

          <div class="profile-metrics">
            <span>14.k Followers</span>
            <span>359 Following</span>
          </div>

          <p class="profile-copy">
            Meet Jacob Jones, the whimsical adventurer on a quest for life's quirks. From sock mysteries to subway adventures,
            join him for a laughter-filled journey!
          </p>

          <h3>Mutual Friends</h3>
          <div class="friend-strip">
            <Avatar image="https://i.pravatar.cc/80?img=13" shape="circle" />
            <Avatar image="https://i.pravatar.cc/80?img=14" shape="circle" />
            <Avatar image="https://i.pravatar.cc/80?img=15" shape="circle" />
            <Avatar image="https://i.pravatar.cc/80?img=16" shape="circle" />
            <Avatar image="https://i.pravatar.cc/80?img=17" shape="circle" />
            <span class="friend-more">+99</span>
          </div>

          <div class="segment-control">
            <Button
              label="Joined"
              rounded
              size="small"
              :text="joinTab !== 'Joined'"
              :severity="joinTab === 'Joined' ? undefined : 'secondary'"
              @click="joinTab = 'Joined'"
            />
            <Button
              label="Hosted"
              rounded
              size="small"
              :text="joinTab !== 'Hosted'"
              :severity="joinTab === 'Hosted' ? undefined : 'secondary'"
              @click="joinTab = 'Hosted'"
            />
          </div>

          <article v-for="row in inviteRows" :key="row.id" class="invite-row">
            <div>
              <Avatar :image="row.avatar" shape="circle" />
              <div>
                <strong>{{ row.name }}</strong>
                <small>{{ row.email }}</small>
              </div>
            </div>
            <Button :label="row.joined ? 'Joined' : 'Join'" :severity="row.joined ? 'secondary' : undefined" @click="toggleInvite(row.id)" />
          </article>
        </article>

        <article class="panel mini-profile-row">
          <div>
            <Avatar image="https://i.pravatar.cc/80?img=11" shape="circle" />
            <div>
              <strong>Jacob Jones</strong>
              <small>hi@jacobjones.co</small>
            </div>
          </div>
          <Button text rounded severity="secondary" icon="pi pi-bell" />
        </article>
      </section>

      <section class="panel upload-card">
        <header>
          <h2><i class="pi pi-cloud-upload" /> Upload Files</h2>
          <Button text rounded severity="secondary" icon="pi pi-times" />
        </header>

        <label>
          <span>Document Name</span>
          <InputText v-model="uploadTitle" />
        </label>

        <label>
          <span>Upload Files</span>
          <input ref="fileInput" type="file" multiple hidden @change="onPickFiles" />
          <button type="button" class="drop-zone" @click="triggerPick">
            <i class="pi pi-cloud-upload" />
            <strong>Click to upload or and drop</strong>
            <small>PDF, JPG, PNG, JPEG, DOC, CSV, XML, XMLX, XLS, XLSX (max 10MB)</small>
          </button>
        </label>

        <div v-if="selectedFiles.length" class="selected-files">
          <Chip v-for="file in selectedFiles" :key="file.name" :label="file.name" />
        </div>

        <label>
          <span>Tag (Optional)</span>
          <div class="tag-editor">
            <Chip
              v-for="tag in tags"
              :key="tag"
              :label="tag"
              removable
              @remove="removeTag(tag)"
            />
            <InputText v-model="addTagDraft" placeholder="new tag" @keyup.enter="addTag" />
          </div>
        </label>

        <div class="visibility-row">
          <Button
            :label="adminsOnly ? 'Admins only' : 'Everyone'"
            icon="pi pi-globe"
            severity="secondary"
            outlined
            @click="adminsOnly = !adminsOnly"
          />
          <ToggleSwitch v-model="adminsOnly" />
        </div>

        <Button label="Continue" class="upload-action" @click="submitUpload" />
      </section>

      <section class="card-right-column">
        <article class="panel settings-card">
          <header>
            <h2>User Profiles</h2>
            <div class="segment-control">
              <Button
                label="Chilling"
                rounded
                size="small"
                :text="profileMode !== 'Chilling'"
                :severity="profileMode === 'Chilling' ? undefined : 'secondary'"
                @click="profileMode = 'Chilling'"
              />
              <Button
                label="Do Not Disturb"
                rounded
                size="small"
                :text="profileMode !== 'Do Not Disturb'"
                :severity="profileMode === 'Do Not Disturb' ? undefined : 'secondary'"
                @click="profileMode = 'Do Not Disturb'"
              />
            </div>
          </header>

          <div class="settings-rows">
            <div><span><i class="pi pi-volume-up" /> Sound</span> <ToggleSwitch v-model="toggles.sound" /></div>
            <div><span><i class="pi pi-wifi" /> Wi-Fi</span> <ToggleSwitch v-model="toggles.wifi" /></div>
            <div><span><i class="pi pi-moon" /> Dark Mode</span> <ToggleSwitch v-model="toggles.darkMode" /></div>
            <div><span><i class="pi pi-map-marker" /> Location Services</span> <ToggleSwitch v-model="toggles.location" /></div>
            <div><span><i class="pi pi-shield" /> Privacy Settings</span> <ToggleSwitch v-model="toggles.privacy" /></div>
            <div><span><i class="pi pi-refresh" /> Auto Update</span> <ToggleSwitch v-model="toggles.autoUpdate" /></div>
          </div>
        </article>

        <article class="panel forgot-card">
          <h2>Forgot Password</h2>
          <p>
            Verification code <br />
            has been sent to email
          </p>
          <strong>u*******m@gmail.com</strong>
          <Button text label="Resend" />
        </article>
      </section>
    </div>
  </section>
</template>
