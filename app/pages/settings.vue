<script setup lang="ts">
import Avatar from "primevue/avatar";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import ProgressBar from "primevue/progressbar";
import SelectButton from "primevue/selectbutton";
import { useToast } from "primevue/usetoast";
import Cropper from "cropperjs";
import "~/assets/vendor/cropper.css";
import type { AuthUserDto } from "~/types/auth";

interface ErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

interface ProfileResponse {
  user: AuthUserDto;
}

interface UpdateProfileResponse {
  message: string;
  user: AuthUserDto;
}

interface UploadUrlResponse {
  upload_url: string;
  upload_headers: Record<string, string>;
  avatar_path: string;
  expires_in: number;
}

interface AvatarUploadFallbackResponse {
  avatar_path: string;
  message: string;
}

type SettingsTab = "profile" | "notifications" | "security";
type LocaleValue = "uk" | "en" | "ru";

const tabs: Array<{ key: SettingsTab; label: string }> = [
  { key: "profile", label: "Profile" },
  { key: "notifications", label: "Notifications" },
  { key: "security", label: "Security" }
];

const localeOptions: Array<{ label: string; value: LocaleValue }> = [
  { label: "Українська", value: "uk" },
  { label: "English", value: "en" },
  { label: "Русский", value: "ru" }
];

const { request } = useApi();
const config = useRuntimeConfig();
const auth = useAuth();
const toast = useToast();

const fileInputRef = ref<HTMLInputElement | null>(null);
const cropperImageRef = ref<HTMLImageElement | null>(null);
const cropperInstance = shallowRef<Cropper | null>(null);

const activeTab = ref<SettingsTab>("profile");
const loadingProfile = ref(true);
const savingProfile = ref(false);
const uploadInProgress = ref(false);
const uploadProgress = ref(0);
const uploadStatus = ref("");
const errorText = ref("");
const localPreviewUrl = ref<string | null>(null);
const avatarPreviewNonce = ref(0);
const isDropZoneActive = ref(false);

const cropDialogVisible = ref(false);
const cropImageUrl = ref<string | null>(null);
const cropSourceFileName = ref("");
const cropSubmitting = ref(false);

const form = reactive({
  nickname: "",
  email: "",
  locale: "en" as LocaleValue,
  avatarPath: null as string | null,
  avatarUrl: null as string | null
});

const canSave = computed(() => {
  return !loadingProfile.value && !savingProfile.value && !uploadInProgress.value;
});

const avatarInitials = computed(() => {
  return form.nickname ? form.nickname.slice(0, 2).toUpperCase() : "ME";
});

const avatarImage = computed(() => form.avatarUrl ?? undefined);

const extractError = (error: unknown): string => {
  const data = (error as { data?: ErrorResponse })?.data;

  if (data?.errors) {
    const firstKey = Object.keys(data.errors)[0];
    if (firstKey) {
      return data.errors[firstKey]?.[0] ?? "Request failed.";
    }
  }

  const message = data?.message ?? (error as { message?: string })?.message ?? "Request failed.";

  if (/SQLSTATE|Connection:\s*pgsql|Database/i.test(message)) {
    return "Database connection error on backend. Check Laravel .env credentials and restart API.";
  }

  return message;
};

const revokeLocalPreview = () => {
  if (!localPreviewUrl.value) {
    return;
  }

  URL.revokeObjectURL(localPreviewUrl.value);
  localPreviewUrl.value = null;
};

const revokeCropImage = () => {
  if (!cropImageUrl.value) {
    return;
  }

  URL.revokeObjectURL(cropImageUrl.value);
  cropImageUrl.value = null;
};

const setAvatarPreview = (url: string | null) => {
  form.avatarUrl = url;
  avatarPreviewNonce.value += 1;
};

const profileReadPath = () => `/api/settings/profile?_=${Date.now()}`;

const requireAccessToken = async () => {
  const token = await auth.getAccessToken();
  if (!token) {
    throw new Error("Unauthorized");
  }

  return token;
};

const applyUser = (user: AuthUserDto) => {
  form.nickname = user.nickname;
  form.email = user.email;
  form.locale = user.locale;
  setAvatarPreview(user.avatar_url);
  auth.setUser(user);
};

const validateAvatarFile = (file: File): string | null => {
  if (!file.type.startsWith("image/")) {
    return "Please select an image file.";
  }

  if (file.size > 5 * 1024 * 1024) {
    return "Avatar must be 5MB or less.";
  }

  return null;
};

const loadProfile = async () => {
  loadingProfile.value = true;
  errorText.value = "";

  try {
    const token = await requireAccessToken();

    const response = await request<ProfileResponse>(profileReadPath(), {
      method: "GET",
      token,
      headers: {
        "Cache-Control": "no-cache"
      }
    });

    applyUser(response.user);
  } catch (error) {
    errorText.value = extractError(error);
  } finally {
    loadingProfile.value = false;
  }
};

const applyAvatarPathToProfile = async (avatarPath: string) => {
  const token = await requireAccessToken();

  await request<UpdateProfileResponse>("/api/settings/profile", {
    method: "PUT",
    token,
    body: {
      nickname: form.nickname,
      locale: form.locale,
      avatar_path: avatarPath
    }
  });

  const profileResponse = await request<ProfileResponse>(profileReadPath(), {
    method: "GET",
    token,
    headers: {
      "Cache-Control": "no-cache"
    }
  });

  form.avatarPath = null;
  revokeLocalPreview();
  applyUser(profileResponse.user);

  toast.add({
    severity: "success",
    summary: "Avatar Updated",
    detail: "Profile photo was saved.",
    life: 2000
  });
};

const putFileToSignedUrl = async (
  url: string,
  headers: Record<string, string>,
  file: File,
  onProgress: (percent: number) => void
) => {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", file.type);

    Object.entries(headers).forEach(([name, value]) => {
      if (["host", "content-length"].includes(name.toLowerCase())) {
        return;
      }

      xhr.setRequestHeader(name, value);
    });

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }

      reject(new Error(`Upload failed: ${xhr.status}`));
    };

    xhr.onerror = () => reject(new Error("Network error while uploading avatar directly to S3."));
    xhr.onabort = () => reject(new Error("Upload was canceled."));

    xhr.send(file);
  });
};

const uploadAvatarViaBackend = async (file: File, token: string, onProgress: (percent: number) => void) => {
  return await new Promise<AvatarUploadFallbackResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    formData.append("avatar", file);

    xhr.open("POST", `${config.public.apiBase}/api/settings/profile/avatar-upload`, true);
    xhr.responseType = "json";
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      let payload = xhr.response as AvatarUploadFallbackResponse | ErrorResponse | null;

      if (!payload && xhr.responseText) {
        try {
          payload = JSON.parse(xhr.responseText) as AvatarUploadFallbackResponse | ErrorResponse;
        } catch {
          payload = null;
        }
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        const avatarPath = (payload as AvatarUploadFallbackResponse | null)?.avatar_path;

        if (!avatarPath) {
          reject(new Error("Backend avatar upload returned empty path."));
          return;
        }

        resolve(payload as AvatarUploadFallbackResponse);
        return;
      }

      const serverMessage =
        (payload as ErrorResponse | null)?.message ?? "Backend fallback upload failed. Check API logs.";

      reject(new Error(serverMessage));
    };

    xhr.onerror = () => reject(new Error("Network error while uploading avatar via backend."));
    xhr.onabort = () => reject(new Error("Avatar upload via backend was canceled."));

    xhr.send(formData);
  });
};

const uploadAvatarFile = async (file: File) => {
  errorText.value = "";
  uploadInProgress.value = true;
  uploadProgress.value = 0;

  try {
    const token = await requireAccessToken();

    const signed = await request<UploadUrlResponse>("/api/settings/profile/avatar-upload-url", {
      method: "POST",
      token,
      body: {
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size
      }
    });

    try {
      uploadStatus.value = "Uploading to S3...";

      await putFileToSignedUrl(signed.upload_url, signed.upload_headers, file, (percent) => {
        uploadProgress.value = percent;
        uploadStatus.value = percent < 100 ? `Uploading to S3: ${percent}%` : "Finalizing...";
      });

      form.avatarPath = signed.avatar_path;
      uploadStatus.value = "Avatar uploaded. Save profile to apply.";
    } catch {
      uploadProgress.value = 0;
      uploadStatus.value = "Switching to backend upload...";

      const fallback = await uploadAvatarViaBackend(file, token, (percent) => {
        uploadProgress.value = percent;
        uploadStatus.value = percent < 100 ? `Uploading via backend: ${percent}%` : "Finalizing...";
      });

      form.avatarPath = fallback.avatar_path;
      uploadStatus.value = "Avatar uploaded via backend. Save profile to apply.";
    }

    revokeLocalPreview();
    localPreviewUrl.value = URL.createObjectURL(file);
    setAvatarPreview(localPreviewUrl.value);

    if (form.avatarPath) {
      uploadStatus.value = "Applying avatar...";

      try {
        await applyAvatarPathToProfile(form.avatarPath);
        uploadStatus.value = "Avatar uploaded and applied.";
      } catch (applyError) {
        errorText.value = extractError(applyError);
        uploadStatus.value = "Avatar uploaded. Click Save to apply.";
      }
    }
  } catch (error) {
    errorText.value = extractError(error);
    uploadStatus.value = "";
  } finally {
    uploadInProgress.value = false;
  }
};

const fitCropBoxToCenter = (cropper: Cropper) => {
  const container = cropper.getContainerData();
  const size = Math.round(Math.min(container.width, container.height) * 0.72);

  cropper.setCropBoxData({
    left: (container.width - size) / 2,
    top: (container.height - size) / 2,
    width: size,
    height: size
  });
};

const fitImageToCropBox = (cropper: Cropper) => {
  const imageData = cropper.getImageData();
  const cropBoxData = cropper.getCropBoxData();
  const container = cropper.getContainerData();

  if (!imageData.naturalWidth || !imageData.naturalHeight) {
    return;
  }

  const coverRatio = Math.max(
    container.width / imageData.naturalWidth,
    container.height / imageData.naturalHeight,
    cropBoxData.width / imageData.naturalWidth,
    cropBoxData.height / imageData.naturalHeight
  );

  const safeRatio = Number.isFinite(coverRatio) && coverRatio > 0 ? coverRatio : 1;
  cropper.zoomTo(safeRatio * 1.02);

  const updated = cropper.getImageData();

  cropper.moveTo((container.width - updated.width) / 2, (container.height - updated.height) / 2);
};

const syncCropperLayout = () => {
  const cropper = cropperInstance.value;

  if (!cropper) {
    return;
  }

  cropper.setAspectRatio(1);
  fitCropBoxToCenter(cropper);
  fitImageToCropBox(cropper);
};

const syncCropperLayoutWithRetry = (attempt = 0) => {
  if (!cropDialogVisible.value) {
    return;
  }

  if (!cropperInstance.value) {
    if (attempt < 10) {
      setTimeout(() => {
        syncCropperLayoutWithRetry(attempt + 1);
      }, 40);
    }

    return;
  }

  syncCropperLayout();
};

const destroyCropper = () => {
  cropperInstance.value?.destroy();
  cropperInstance.value = null;
};

const initCropper = async () => {
  await nextTick();

  if (!cropDialogVisible.value || !cropperImageRef.value || !cropImageUrl.value) {
    return;
  }

  destroyCropper();

  let instance: Cropper;
  instance = new Cropper(cropperImageRef.value, {
    aspectRatio: 1,
    viewMode: 1,
    dragMode: "move",
    background: false,
    autoCropArea: 1,
    guides: false,
    center: false,
    highlight: false,
    cropBoxResizable: false,
    cropBoxMovable: false,
    zoomable: true,
    scalable: false,
    rotatable: false,
    toggleDragModeOnDblclick: false,
    ready: () => {
      syncCropperLayoutWithRetry();
    }
  });

  cropperInstance.value = instance;
};

const cancelCropDialog = () => {
  if (cropSubmitting.value) {
    return;
  }

  cropDialogVisible.value = false;
};

const openCropDialogForFile = async (file: File) => {
  const validationError = validateAvatarFile(file);

  if (validationError) {
    errorText.value = validationError;
    return;
  }

  errorText.value = "";
  cropSubmitting.value = false;
  cropSourceFileName.value = file.name;

  revokeCropImage();
  cropImageUrl.value = URL.createObjectURL(file);
  cropDialogVisible.value = true;
};

const onCropDialogShow = () => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      syncCropperLayoutWithRetry();
    });
  });

  setTimeout(() => {
    syncCropperLayoutWithRetry();
  }, 140);
};

const openAvatarPicker = () => {
  if (uploadInProgress.value || loadingProfile.value) {
    return;
  }

  fileInputRef.value?.click();
};

const onAvatarSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = "";

  if (!file) {
    return;
  }

  await openCropDialogForFile(file);
};

const onDropZoneDragEnter = (event: DragEvent) => {
  event.preventDefault();

  if (uploadInProgress.value || loadingProfile.value) {
    return;
  }

  isDropZoneActive.value = true;
};

const onDropZoneDragOver = (event: DragEvent) => {
  event.preventDefault();

  if (uploadInProgress.value || loadingProfile.value) {
    return;
  }

  isDropZoneActive.value = true;
};

const onDropZoneDragLeave = (event: DragEvent) => {
  event.preventDefault();
  isDropZoneActive.value = false;
};

const onDropZoneDrop = async (event: DragEvent) => {
  event.preventDefault();
  isDropZoneActive.value = false;

  if (uploadInProgress.value || loadingProfile.value) {
    return;
  }

  const file = event.dataTransfer?.files?.[0];

  if (!file) {
    return;
  }

  await openCropDialogForFile(file);
};

const zoomCrop = (delta: number) => {
  cropperInstance.value?.zoom(delta);
};

const resetCrop = () => {
  const cropper = cropperInstance.value;

  if (!cropper) {
    return;
  }

  cropper.reset();
  syncCropperLayout();
};

const createCroppedAvatarFile = async () => {
  const cropper = cropperInstance.value;

  if (!cropper) {
    throw new Error("Cropper is not initialized.");
  }

  const squareCanvas = cropper.getCroppedCanvas({
    width: 640,
    height: 640,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high"
  });

  if (!squareCanvas) {
    throw new Error("Unable to crop avatar image.");
  }

  const circleCanvas = document.createElement("canvas");
  circleCanvas.width = squareCanvas.width;
  circleCanvas.height = squareCanvas.height;

  const context = circleCanvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to process cropped avatar image.");
  }

  const radius = Math.min(circleCanvas.width, circleCanvas.height) / 2;

  context.clearRect(0, 0, circleCanvas.width, circleCanvas.height);
  context.save();
  context.beginPath();
  context.arc(circleCanvas.width / 2, circleCanvas.height / 2, radius, 0, Math.PI * 2);
  context.closePath();
  context.clip();
  context.drawImage(squareCanvas, 0, 0, circleCanvas.width, circleCanvas.height);
  context.restore();

  const blob = await new Promise<Blob>((resolve, reject) => {
    circleCanvas.toBlob((generated) => {
      if (!generated) {
        reject(new Error("Unable to create cropped image."));
        return;
      }

      resolve(generated);
    }, "image/png", 0.92);
  });

  return new File([blob], `avatar-${Date.now()}.png`, {
    type: "image/png"
  });
};

const confirmCropAndUpload = async () => {
  if (!cropperInstance.value) {
    return;
  }

  cropSubmitting.value = true;

  try {
    const croppedFile = await createCroppedAvatarFile();
    cropDialogVisible.value = false;
    await uploadAvatarFile(croppedFile);
  } catch (error) {
    errorText.value = extractError(error);
  } finally {
    cropSubmitting.value = false;
  }
};

const saveProfile = async () => {
  errorText.value = "";
  savingProfile.value = true;

  try {
    const token = await requireAccessToken();

    const response = await request<UpdateProfileResponse>("/api/settings/profile", {
      method: "PUT",
      token,
      body: {
        nickname: form.nickname,
        locale: form.locale,
        avatar_path: form.avatarPath
      }
    });

    form.avatarPath = null;

    revokeLocalPreview();
    applyUser(response.user);

    toast.add({
      severity: "success",
      summary: "Saved",
      detail: response.message,
      life: 2200
    });
  } catch (error) {
    errorText.value = extractError(error);
  } finally {
    savingProfile.value = false;
  }
};

watch(cropDialogVisible, (visible) => {
  if (!visible) {
    destroyCropper();
    revokeCropImage();
    cropSourceFileName.value = "";
    return;
  }

  nextTick(async () => {
    await initCropper();
    onCropDialogShow();
  });
});

onMounted(async () => {
  await loadProfile();
});

onBeforeUnmount(() => {
  destroyCropper();
  revokeCropImage();
  revokeLocalPreview();
});
</script>

<template>
  <section class="pv-page settings-page">
    <header class="customers-head">
      <div>
        <h1>Settings</h1>
        <p>Account and workspace preferences</p>
      </div>
      <Button icon="pi pi-save" label="Save" :loading="savingProfile" :disabled="!canSave || activeTab !== 'profile'" @click="saveProfile" />
    </header>

    <div class="settings-tabs segment-control wide">
      <Button
        v-for="tab in tabs"
        :key="tab.key"
        rounded
        size="small"
        :label="tab.label"
        :text="activeTab !== tab.key"
        :severity="activeTab === tab.key ? undefined : 'secondary'"
        @click="activeTab = tab.key"
      />
    </div>

    <section v-if="activeTab === 'profile'" class="settings-profile-grid">
      <article class="panel profile-avatar-panel">
        <h2>Profile Photo</h2>

        <div class="avatar-preview-wrap">
          <Avatar
            :key="avatarPreviewNonce"
            :image="avatarImage"
            :label="avatarImage ? undefined : avatarInitials"
            shape="circle"
            class="profile-avatar-large"
          />
          <span v-if="form.avatarPath" class="avatar-unsaved-badge">New photo ready</span>
        </div>

        <input ref="fileInputRef" type="file" accept="image/*" hidden @change="onAvatarSelected" />

        <div
          class="avatar-dropzone"
          :class="{
            active: isDropZoneActive,
            disabled: uploadInProgress || loadingProfile
          }"
          role="button"
          tabindex="0"
          @click="openAvatarPicker"
          @keydown.enter.prevent="openAvatarPicker"
          @keydown.space.prevent="openAvatarPicker"
          @dragenter="onDropZoneDragEnter"
          @dragover="onDropZoneDragOver"
          @dragleave="onDropZoneDragLeave"
          @drop="onDropZoneDrop"
        >
          <i class="pi pi-cloud-upload" aria-hidden="true" />
          <p>Drag and drop photo here</p>
          <small>or click to choose file</small>
        </div>

        <div class="avatar-actions">
          <Button
            icon="pi pi-image"
            label="Choose photo"
            :disabled="uploadInProgress || loadingProfile"
            :loading="uploadInProgress"
            @click="openAvatarPicker"
          />
          <small>JPG, PNG, WebP. Max 5MB.</small>
        </div>

        <div v-if="uploadInProgress || uploadStatus" class="upload-progress-wrap">
          <ProgressBar :value="uploadProgress" />
          <p>{{ uploadStatus }}</p>
        </div>
      </article>

      <article class="panel profile-fields-panel">
        <h2>My Profile</h2>

        <label>
          <span>Nickname</span>
          <InputText v-model="form.nickname" :disabled="loadingProfile || uploadInProgress" autocomplete="nickname" />
        </label>

        <label>
          <span>Email (read-only)</span>
          <InputText v-model="form.email" disabled readonly />
        </label>

        <label>
          <span>Language</span>
          <SelectButton
            v-model="form.locale"
            :options="localeOptions"
            optionLabel="label"
            optionValue="value"
            :disabled="loadingProfile || uploadInProgress"
          />
        </label>

        <Message v-if="errorText" severity="error" size="small">{{ errorText }}</Message>
      </article>
    </section>

    <section v-else class="panel settings-placeholder">
      <h2>{{ activeTab === 'notifications' ? 'Notifications' : 'Security' }}</h2>
      <p>Next step: we will move these settings here after profile module.</p>
    </section>

    <Dialog
      v-model:visible="cropDialogVisible"
      modal
      header="Adjust profile photo"
      class="avatar-crop-dialog"
      :style="{ width: 'min(760px, 94vw)' }"
      :closable="!cropSubmitting"
      :dismissableMask="!cropSubmitting"
      :draggable="false"
      @show="onCropDialogShow"
      @hide="cancelCropDialog"
    >
      <div class="crop-dialog-body">
        <div class="crop-stage">
          <img ref="cropperImageRef" :src="cropImageUrl ?? undefined" alt="Crop avatar" />
        </div>

        <div class="crop-dialog-controls">
          <p>Move image and zoom to fit the circular frame.</p>

          <div class="crop-buttons-row">
            <Button text rounded icon="pi pi-search-minus" @click="zoomCrop(-0.1)" />
            <Button text rounded icon="pi pi-refresh" @click="resetCrop" />
            <Button text rounded icon="pi pi-search-plus" @click="zoomCrop(0.1)" />
          </div>

          <small>{{ cropSourceFileName }}</small>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" text :disabled="cropSubmitting" @click="cancelCropDialog" />
        <Button
          icon="pi pi-check"
          label="Use this photo"
          :loading="cropSubmitting || uploadInProgress"
          :disabled="uploadInProgress"
          @click="confirmCropAndUpload"
        />
      </template>
    </Dialog>
  </section>
</template>
