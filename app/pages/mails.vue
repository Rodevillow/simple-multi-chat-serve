<script setup lang="ts">
import Avatar from "primevue/avatar";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import InputText from "primevue/inputtext";
import ProgressBar from "primevue/progressbar";
import Tag from "primevue/tag";
import { useToast } from "primevue/usetoast";

type MailFolder = "Inbox" | "Starry" | "Drafts" | "Important" | "Sent" | "Archive" | "Spam" | "Trash";

interface MailItem {
  id: string;
  sender: string;
  initials: string;
  avatar?: string;
  subject: string;
  preview: string;
  label: "Security" | "Update" | "Marketing" | "HR" | "Invoice" | "Events" | "Discount" | "Newsletter" | "Invitation";
  folder: MailFolder;
  time: string;
  starred?: boolean;
  unread?: boolean;
}

const toast = useToast();
const selectedFolder = ref<MailFolder>("Inbox");
const query = ref("");
const selectedMailIds = ref<string[]>([]);

const navFolders: MailFolder[] = ["Inbox", "Starry", "Drafts", "Important", "Sent", "Archive", "Spam", "Trash"];
const otherFolders = ["Security", "Update", "Marketing"];

const mails = ref<MailItem[]>([
  {
    id: "m1",
    sender: "Brook Simmons",
    initials: "BS",
    avatar: "https://i.pravatar.cc/120?img=12",
    subject: "Important Account Update",
    preview: "Dear customer, we've made updates to your account security settings.",
    label: "Security",
    folder: "Inbox",
    time: "3:24 PM",
    unread: true
  },
  {
    id: "m2",
    sender: "Dianne Russell",
    initials: "DR",
    avatar: "https://i.pravatar.cc/120?img=24",
    subject: "Weekly Project Update",
    preview: "Hi team, attached is the weekly project report and pending items.",
    label: "Update",
    folder: "Inbox",
    time: "11:24 AM",
    starred: true
  },
  {
    id: "m3",
    sender: "Amy Elsner",
    initials: "AE",
    avatar: "https://i.pravatar.cc/120?img=28",
    subject: "Urgent: Security Alert - Account Compromise",
    preview: "Dear user, we detected an unusual sign-in attempt from a new location.",
    label: "Security",
    folder: "Inbox",
    time: "9:24 AM",
    unread: true
  },
  {
    id: "m4",
    sender: "Jacob Jones",
    initials: "JJ",
    avatar: "https://i.pravatar.cc/120?img=32",
    subject: "Exclusive Offer Inside - Limited Time Only",
    preview: "Greetings, check our limited pricing campaign available this week only.",
    label: "Marketing",
    folder: "Inbox",
    time: "Jan 21"
  },
  {
    id: "m5",
    sender: "Cameron Watson",
    initials: "CW",
    subject: "Employee Appreciation Event - Save the Date",
    preview: "Hello team, next month we are planning an internal event.",
    label: "HR",
    folder: "Inbox",
    time: "Jan 15"
  },
  {
    id: "m6",
    sender: "Wade Warren",
    initials: "WW",
    subject: "Your Recent Purchase - Order Confirmation",
    preview: "Hi Wade Warren, your payment was successful and order has been packed.",
    label: "Invoice",
    folder: "Inbox",
    time: "Jan 12"
  },
  {
    id: "m7",
    sender: "Guy Hawkins",
    initials: "GH",
    avatar: "https://i.pravatar.cc/120?img=18",
    subject: "Early Bird Registration Open - XYZ Conference 2024",
    preview: "Attention! Grab your seat now for the conference.",
    label: "Events",
    folder: "Inbox",
    time: "Jan 11",
    unread: true
  },
  {
    id: "m8",
    sender: "Annette Black",
    initials: "AB",
    avatar: "https://i.pravatar.cc/120?img=35",
    subject: "Upcoming System Maintenance Notice",
    preview: "Dear valued customer, services may be unavailable this Saturday.",
    label: "Update",
    folder: "Inbox",
    time: "Jan 8"
  },
  {
    id: "m9",
    sender: "Darrell Steward",
    initials: "DS",
    avatar: "https://i.pravatar.cc/120?img=45",
    subject: "Special Discounts for VIP Customers",
    preview: "Hello Darrell Steward, exclusive prices are now active in your account.",
    label: "Discount",
    folder: "Inbox",
    time: "Jan 4"
  },
  {
    id: "m10",
    sender: "Jerome Bell",
    initials: "JB",
    subject: "Monthly Newsletter - January Edition",
    preview: "Dear user, we've updated roadmap, tutorials and changelog.",
    label: "Newsletter",
    folder: "Inbox",
    time: "Jan 2"
  },
  {
    id: "m11",
    sender: "Onyama Limba",
    initials: "OL",
    avatar: "https://i.pravatar.cc/120?img=48",
    subject: "Exclusive Travel Packages for You",
    preview: "Greetings traveler, explore curated destinations in Europe and Asia.",
    label: "Marketing",
    folder: "Inbox",
    time: "Jan 2"
  },
  {
    id: "m12",
    sender: "Robert Fox",
    initials: "RF",
    subject: "Invitation to Amsterdam",
    preview: "Hello Robert Fox, you're invited to our partner meetup in Amsterdam.",
    label: "Invitation",
    folder: "Inbox",
    time: "12.12.2023"
  }
]);

const visibleMails = computed(() => {
  const q = query.value.trim().toLowerCase();

  return mails.value.filter((mail) => {
    if (mail.folder !== selectedFolder.value) {
      return false;
    }

    if (!q) {
      return true;
    }

    return (
      mail.sender.toLowerCase().includes(q) ||
      mail.subject.toLowerCase().includes(q) ||
      mail.preview.toLowerCase().includes(q)
    );
  });
});

const allVisibleSelected = computed(() => {
  if (!visibleMails.value.length) {
    return false;
  }

  return visibleMails.value.every((mail) => selectedMailIds.value.includes(mail.id));
});

const toggleSelectAll = () => {
  if (allVisibleSelected.value) {
    selectedMailIds.value = selectedMailIds.value.filter(
      (id) => !visibleMails.value.some((mail) => mail.id === id)
    );
    return;
  }

  const merged = new Set([...selectedMailIds.value, ...visibleMails.value.map((mail) => mail.id)]);
  selectedMailIds.value = [...merged];
};

const mutateSelection = (mode: "archive" | "trash") => {
  if (!selectedMailIds.value.length) {
    return;
  }

  mails.value = mails.value.map((mail) => {
    if (!selectedMailIds.value.includes(mail.id)) {
      return mail;
    }

    return {
      ...mail,
      folder: mode === "archive" ? "Archive" : "Trash"
    };
  });

  selectedMailIds.value = [];

  toast.add({
    severity: "success",
    summary: mode === "archive" ? "Archived" : "Moved to Trash",
    detail: "Selected emails were updated",
    life: 1800
  });
};

const toggleStar = (mailId: string) => {
  mails.value = mails.value.map((mail) => {
    if (mail.id !== mailId) {
      return mail;
    }

    return {
      ...mail,
      starred: !mail.starred
    };
  });
};

const severityFromLabel = (label: MailItem["label"]) => {
  if (label === "Security") {
    return "contrast";
  }

  if (label === "Update" || label === "Newsletter") {
    return "info";
  }

  if (label === "Marketing" || label === "Events") {
    return "success";
  }

  if (label === "Invoice" || label === "Discount") {
    return "warn";
  }

  return "secondary";
};
</script>

<template>
  <section class="pv-page mails-page">
    <div class="mails-shell">
      <aside class="mail-nav panel">
        <header>
          <h1>Mails</h1>
          <Button icon="pi pi-plus" />
        </header>

        <div class="mail-nav-group">
          <small>Navigation</small>
          <button
            v-for="folder in navFolders"
            :key="folder"
            type="button"
            class="mail-nav-item"
            :class="{ active: selectedFolder === folder }"
            @click="selectedFolder = folder"
          >
            <i class="pi" :class="folder === 'Inbox' ? 'pi-inbox' : folder === 'Starry' ? 'pi-star' : folder === 'Drafts' ? 'pi-file' : folder === 'Important' ? 'pi-flag' : folder === 'Sent' ? 'pi-send' : folder === 'Archive' ? 'pi-folder' : folder === 'Spam' ? 'pi-exclamation-circle' : 'pi-trash'" />
            {{ folder }}
          </button>
        </div>

        <div class="mail-nav-group">
          <small>Other</small>
          <button v-for="tag in otherFolders" :key="tag" type="button" class="mail-nav-item">
            <i class="pi pi-tag" /> {{ tag }}
          </button>
        </div>

        <article class="mail-plan">
          <h2>Free Version</h2>
          <div class="plan-bar">
            <ProgressBar :value="56" />
            <span>4 days left</span>
          </div>
          <Button label="Upgrade to PRO 🚀" severity="secondary" outlined />
        </article>
      </aside>

      <section class="mail-content panel">
        <header class="mail-toolbar">
          <div class="toolbar-left">
            <Checkbox binary :model-value="allVisibleSelected" @update:model-value="toggleSelectAll" />
            <Button text rounded severity="secondary" icon="pi pi-envelope" />
            <Button text rounded severity="secondary" icon="pi pi-exclamation-circle" />
            <Button text rounded severity="secondary" icon="pi pi-tag" />
            <Button text severity="secondary" label="Archive" icon="pi pi-inbox" @click="mutateSelection('archive')" />
            <Button text severity="secondary" label="Trash" icon="pi pi-trash" @click="mutateSelection('trash')" />
          </div>

          <div class="toolbar-right">
            <span class="search-wrap compact">
              <i class="pi pi-search" />
              <InputText v-model="query" placeholder="Search" />
            </span>
            <Button text rounded severity="secondary" icon="pi pi-filter" />
            <Button text rounded severity="secondary" icon="pi pi-refresh" />
            <div class="pager-pill">1 of 15</div>
            <Button text rounded severity="secondary" icon="pi pi-angle-left" />
            <Button text rounded severity="secondary" icon="pi pi-angle-right" />
          </div>
        </header>

        <div class="mail-list">
          <article v-for="mail in visibleMails" :key="mail.id" class="mail-row" :class="{ unread: mail.unread }">
            <Checkbox v-model="selectedMailIds" :value="mail.id" />

            <button type="button" class="icon-btn" @click="toggleStar(mail.id)">
              <i class="pi" :class="mail.starred ? 'pi-bookmark-fill' : 'pi-bookmark'" />
            </button>

            <Avatar v-if="mail.avatar" :image="mail.avatar" shape="circle" />
            <Avatar v-else :label="mail.initials" shape="circle" />

            <strong>{{ mail.sender }}</strong>
            <p>
              <span>{{ mail.subject }}</span>
              {{ mail.preview }}
            </p>

            <Tag :value="mail.label" :severity="severityFromLabel(mail.label)" rounded />
            <time>{{ mail.time }}</time>
          </article>

          <p v-if="!visibleMails.length" class="empty-state">No emails in this folder.</p>
        </div>
      </section>
    </div>
  </section>
</template>
