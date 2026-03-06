<script setup lang="ts">
import Avatar from "primevue/avatar";
import Button from "primevue/button";
import InputText from "primevue/inputtext";

interface MovieCard {
  id: string;
  title: string;
  genres: string;
  rating: number;
  image: string;
}

interface OpportunityCard {
  id: string;
  name: string;
  image: string;
  description: string;
}

const query = ref("");
const menuTab = ref<"Home" | "Movies" | "TV Shows" | "Recently Added" | "My List">("Home");
const sectionTab = ref<"Popular" | "New Releases" | "Recently Added" | "For you">("Popular");
const showPanel = ref(false);
const menuOptions: Array<(typeof menuTab)["value"]> = ["Home", "Movies", "TV Shows", "Recently Added", "My List"];
const sectionOptions: Array<(typeof sectionTab)["value"]> = ["Popular", "New Releases", "Recently Added", "For you"];

const keepWatching = ref<MovieCard[]>([
  {
    id: "kw1",
    title: "Heat",
    genres: "Action, Crime, Drama",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1502209524168-aca664011fd8?auto=format&fit=crop&w=1200&q=60"
  },
  {
    id: "kw2",
    title: "Batman Begins",
    genres: "Action, Crime, Drama",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=1200&q=60"
  },
  {
    id: "kw3",
    title: "Leon: The Professional",
    genres: "Action, Crime, Drama",
    rating: 4.3,
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=60"
  },
  {
    id: "kw4",
    title: "Matrix",
    genres: "Action, Sci-Fi",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1518932945647-7a1c969f8be2?auto=format&fit=crop&w=1200&q=60"
  },
  {
    id: "kw5",
    title: "Fight Club",
    genres: "Drama",
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=60"
  }
]);

const discover = ref<MovieCard[]>([
  {
    id: "d1",
    title: "Twelve Angry Men",
    genres: "Crime, Drama",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=60"
  },
  {
    id: "d2",
    title: "Saving Private Ryan",
    genres: "Drama, War",
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&w=1200&q=60"
  },
  {
    id: "d3",
    title: "Seven",
    genres: "Crime, Drama, Mystery",
    rating: 4.3,
    image: "https://images.unsplash.com/photo-1460881680858-30d872d5b530?auto=format&fit=crop&w=1200&q=60"
  },
  {
    id: "d4",
    title: "Shutter Island",
    genres: "Mystery, Thriller",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=60"
  }
]);

const opportunities = ref<OpportunityCard[]>([
  {
    id: "o1",
    name: "Apollo",
    image: "https://picsum.photos/seed/apollo/900/580",
    description: "Keep your application fresh with Apollo, the newest and most modern template available."
  },
  {
    id: "o2",
    name: "Ultima",
    image: "https://picsum.photos/seed/ultima/900/580",
    description: "Elevate your application's intuitiveness with Ultima's premium Material Design interface."
  },
  {
    id: "o3",
    name: "Diamond",
    image: "https://picsum.photos/seed/diamond/900/580",
    description: "Handle complex operations with elegance with Diamond's robust premium design."
  },
  {
    id: "o4",
    name: "Atlantis",
    image: "https://picsum.photos/seed/atlantis/900/580",
    description: "Boost your application's capabilities with the Atlantis template."
  },
  {
    id: "o5",
    name: "Verona",
    image: "https://picsum.photos/seed/verona/900/580",
    description: "A polished enterprise dashboard crafted for scalability and speed."
  },
  {
    id: "o6",
    name: "Freya",
    image: "https://picsum.photos/seed/freya/900/580",
    description: "A modern design system with cohesive UI building blocks."
  }
]);

const filteredKeepWatching = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) {
    return keepWatching.value;
  }

  return keepWatching.value.filter((movie) => movie.title.toLowerCase().includes(q));
});

const filteredDiscover = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) {
    return discover.value;
  }

  return discover.value.filter((movie) => movie.title.toLowerCase().includes(q));
});

const moveMovie = (direction: "prev" | "next") => {
  if (direction === "next") {
    const first = keepWatching.value.shift();
    if (first) {
      keepWatching.value.push(first);
    }
    return;
  }

  const last = keepWatching.value.pop();
  if (last) {
    keepWatching.value.unshift(last);
  }
};
</script>

<template>
  <section class="pv-page movies-page">
    <header class="movies-header">
      <div class="segment-control wide">
        <Button
          v-for="item in menuOptions"
          :key="item"
          rounded
          size="small"
          :label="item"
          :text="menuTab !== item"
          :severity="menuTab === item ? undefined : 'secondary'"
          @click="menuTab = item"
        />
      </div>

      <div class="movies-head-actions">
        <span class="search-wrap compact">
          <i class="pi pi-search" />
          <InputText v-model="query" placeholder="Search" />
        </span>
        <Button text rounded severity="secondary" icon="pi pi-bell">
          <span class="notify-dot" />
        </Button>
        <button type="button" class="avatar-btn" @click="showPanel = true">
          <Avatar image="https://i.pravatar.cc/80?img=8" shape="circle" />
        </button>
      </div>
    </header>

    <section class="movies-section">
      <header>
        <h2>Keep watching</h2>
        <div>
          <Button text rounded severity="secondary" icon="pi pi-angle-left" @click="moveMovie('prev')" />
          <Button text rounded severity="secondary" icon="pi pi-angle-right" @click="moveMovie('next')" />
        </div>
      </header>

      <div class="movie-row">
        <article v-for="movie in filteredKeepWatching" :key="movie.id" class="movie-card">
          <div class="movie-image">
            <img :src="movie.image" :alt="movie.title" />
            <span>{{ movie.rating }}</span>
          </div>
          <h3>{{ movie.title }}</h3>
          <p>{{ movie.genres }}</p>
        </article>
      </div>
    </section>

    <section class="movies-section">
      <header>
        <div class="segment-control wide">
          <Button
            v-for="item in sectionOptions"
            :key="item"
            rounded
            size="small"
            :label="item"
            :text="sectionTab !== item"
            :severity="sectionTab === item ? undefined : 'secondary'"
            @click="sectionTab = item"
          />
        </div>
        <Button text severity="secondary" label="Show All" />
      </header>

      <div class="movie-grid">
        <article v-for="movie in filteredDiscover" :key="movie.id" class="movie-card large">
          <div class="movie-image">
            <img :src="movie.image" :alt="movie.title" />
            <span>{{ movie.rating }}</span>
          </div>
          <h3>{{ movie.title }}</h3>
          <p>{{ movie.genres }}</p>
        </article>
      </div>
    </section>

    <div v-if="showPanel" class="movie-overlay" @click.self="showPanel = false">
      <div class="movie-overlay-banner">Introducing PrimeOne UI Kit v4 with Figma Native Variables <u>Learn More</u></div>

      <aside class="movie-panel">
        <header class="panel-user">
          <Avatar image="https://i.pravatar.cc/90?img=12" shape="circle" size="large" />
          <div>
            <h4>Brook Simmons</h4>
            <p>Sales Executive</p>
          </div>
          <Button text rounded severity="secondary" icon="pi pi-arrow-right" @click="showPanel = false" />
        </header>

        <div class="segment-control wide">
          <Button text rounded label="Interaction Logs" severity="secondary" />
          <Button text rounded label="Preferences" severity="secondary" />
          <Button text rounded label="Statistics" severity="secondary" />
          <Button rounded label="Opportunities" />
        </div>

        <div class="opportunity-grid">
          <article v-for="card in opportunities" :key="card.id" class="opportunity-card">
            <header>
              <strong>{{ card.name }}</strong>
              <Button text rounded severity="secondary" icon="pi pi-external-link" />
            </header>
            <img :src="card.image" :alt="card.name" />
            <p>{{ card.description }}</p>
          </article>
        </div>
      </aside>
    </div>
  </section>
</template>
