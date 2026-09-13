// ============================================================
// MOVIE WEBSITE - MYSQL CONNECTED SCRIPT
// ============================================================

// Backend URL
const API_URL = "http://localhost:5000";

// ============================================================
// MOVIES
// ============================================================

// Movies will now come from MySQL
let movies = [];

// ============================================================
// STATIC USERS / REVIEWS
// ============================================================

const users = [
  {
    id: 1,
    name: "Hatim",
    email: "hatim@example.com",
    subscription: "Premium",
    img: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: 2,
    name: "Aisha",
    email: "aisha@example.com",
    subscription: "VIP",
    img: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: 3,
    name: "Rahul",
    email: "rahul@example.com",
    subscription: "Free",
    img: "https://randomuser.me/api/portraits/men/12.jpg",
  },
  {
    id: 4,
    name: "Sneha",
    email: "sneha@example.com",
    subscription: "Premium",
    img: "https://randomuser.me/api/portraits/women/65.jpg",
  },
  {
    id: 5,
    name: "Arjun",
    email: "arjun@example.com",
    subscription: "VIP",
    img: "https://randomuser.me/api/portraits/men/77.jpg",
  },
];

const reviews = [
  {
    user: "Aisha",
    movie: "Dangal",
    rating: 4,
    comment: "Inspirational and emotional.",
  },
  {
    user: "Sneha",
    movie: "3 Idiots",
    rating: 5,
    comment: "Funny and meaningful.",
  },
  {
    user: "Rahul",
    movie: "KGF",
    rating: 5,
    comment: "Full action and mass movie!",
  },
];

// ============================================================
// FAVORITES
// ============================================================

let favorites = [];

try {
  const savedFavorites = localStorage.getItem("favorites");

  favorites = savedFavorites ? JSON.parse(savedFavorites) : [];

  if (!Array.isArray(favorites)) {
    favorites = [];
  }
} catch (error) {
  console.error("Favorites loading error:", error);
  favorites = [];
}

// ============================================================
// DOM ELEMENTS
// ============================================================

let movieList = null;
let favoriteList = null;
let userList = null;
let reviewList = null;
let searchInput = null;
let genreFilter = null;
let themeToggle = null;

// ============================================================
// LOAD MOVIES FROM MYSQL
// ============================================================

async function loadMovies() {
  try {
    console.log("Loading movies from MySQL...");

    const response = await fetch(`${API_URL}/api/movies`);

    const data = await response.json();

    console.log("Movie API response:", data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to load movies");
    }

    movies = data.movies || [];

    console.log("Movies loaded:", movies);

    // Convert MySQL column names if necessary
    movies = movies.map((movie) => ({
      id: Number(movie.id),
      slug: movie.slug,
      title: movie.title,
      genre: movie.genre,
      year: Number(movie.year),
      rating: Number(movie.rating),
      img: movie.img,
    }));

    loadGenres();

    showMovies();

    showFavorites();
  } catch (error) {
    console.error("Movie loading error:", error);

    if (movieList) {
      movieList.innerHTML = `
        <p style="
          text-align:center;
          grid-column:1/-1;
          color:red;
        ">
          Unable to load movies.
          Please make sure the backend server is running.
        </p>
      `;
    }
  }
}

// ============================================================
// LOAD GENRES
// ============================================================

function loadGenres() {
  if (!genreFilter) return;

  const uniqueGenres = [...new Set(movies.map((movie) => movie.genre))];

  const genres = ["All", ...uniqueGenres];

  genreFilter.innerHTML = "";

  genres.forEach((genre) => {
    const option = document.createElement("option");

    option.value = genre;
    option.textContent = genre;

    genreFilter.appendChild(option);
  });
}

// ============================================================
// CREATE MOVIE CARD
// ============================================================

function createMovieCard(movie) {
  const card = document.createElement("div");

  card.className = "movie-card";

  const isFavorite = favorites.some(
    (fav) => Number(fav.id) === Number(movie.id),
  );

  card.innerHTML = `
    <img 
      src="${movie.img}" 
      alt="${movie.title}"
    >

    <h3>${movie.title}</h3>

    <p>
      ${movie.genre} | ${movie.year}
    </p>

    <p>
      ⭐ ${movie.rating}
    </p>

    <div class="movie-btns">

      <button
        class="watch-btn"
        type="button"
      >
        ▶ Watch
      </button>

      <button
        class="fav-btn"
        type="button"
      >
        ${isFavorite ? "💔 Remove" : "❤️ Favorite"}
      </button>

    </div>
  `;

  // ==========================================================
  // IMAGE ERROR
  // ==========================================================

  const img = card.querySelector("img");

  if (img) {
    img.onerror = function () {
      this.src = "https://via.placeholder.com/300x450?text=Movie+Image";
    };
  }

  // ==========================================================
  // WATCH BUTTON
  // ==========================================================

  const watchBtn = card.querySelector(".watch-btn");

  if (watchBtn) {
    watchBtn.addEventListener("click", () => {
      watchMovie(movie);
    });
  }

  // ==========================================================
  // FAVORITE BUTTON
  // ==========================================================

  const favBtn = card.querySelector(".fav-btn");

  if (favBtn) {
    favBtn.addEventListener("click", () => {
      toggleFavorite(movie.id);
    });
  }

  return card;
}

// ============================================================
// SHOW MOVIES
// ============================================================

function showMovies(filteredMovies = movies) {
  if (!movieList) return;

  movieList.innerHTML = "";

  if (!filteredMovies.length) {
    movieList.innerHTML = `
      <p
        style="
          text-align:center;
          grid-column:1/-1;
        "
      >
        No movies found.
      </p>
    `;

    return;
  }

  filteredMovies.forEach((movie) => {
    movieList.appendChild(createMovieCard(movie));
  });
}

// ============================================================
// SHOW FAVORITES
// ============================================================

function showFavorites() {
  if (!favoriteList) return;

  favoriteList.innerHTML = "";

  if (!favorites.length) {
    favoriteList.innerHTML = `
      <p
        style="
          text-align:center;
          grid-column:1/-1;
        "
      >
        No favorite movies yet.
      </p>
    `;

    return;
  }

  favorites.forEach((movie) => {
    favoriteList.appendChild(createMovieCard(movie));
  });
}

// ============================================================
// TOGGLE FAVORITE
// ============================================================

function toggleFavorite(movieId) {
  const movie = movies.find((m) => Number(m.id) === Number(movieId));

  if (!movie) return;

  const exists = favorites.some((fav) => Number(fav.id) === Number(movieId));

  if (exists) {
    favorites = favorites.filter((fav) => Number(fav.id) !== Number(movieId));
  } else {
    favorites.push(movie);
  }

  try {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  } catch (error) {
    console.error("LocalStorage error:", error);
  }

  applyFilters();

  showFavorites();
}

// ============================================================
// SEARCH + GENRE FILTER
// ============================================================

function applyFilters() {
  const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

  const selectedGenre = genreFilter ? genreFilter.value : "All";

  const filteredMovies = movies.filter((movie) => {
    const matchTitle = movie.title.toLowerCase().includes(searchText);

    const matchGenre = selectedGenre === "All" || movie.genre === selectedGenre;

    return matchTitle && matchGenre;
  });

  showMovies(filteredMovies);
}

// ============================================================
// SHOW USERS
// ============================================================

function showUsers() {
  if (!userList) return;

  userList.innerHTML = "";

  users.forEach((user) => {
    const card = document.createElement("div");

    card.className = "user-card";

    card.innerHTML = `
      <img
        src="${user.img}"
        alt="${user.name}"
      >

      <h3>${user.name}</h3>

      <p>
        Email: ${user.email}
      </p>

      <p>
        Subscription: ${user.subscription}
      </p>
    `;

    const img = card.querySelector("img");

    if (img) {
      img.onerror = function () {
        this.src = "https://via.placeholder.com/300x300?text=User";
      };
    }

    userList.appendChild(card);
  });
}

// ============================================================
// SHOW REVIEWS
// ============================================================

function showReviews() {
  if (!reviewList) return;

  reviewList.innerHTML = "";

  reviews.forEach((review) => {
    const card = document.createElement("div");

    card.className = "review-card";

    card.innerHTML = `
      <h3>
        ${review.user}
        on
        ${review.movie}
      </h3>

      <p>
        Rating: ⭐ ${review.rating}
      </p>

      <p>
        "${review.comment}"
      </p>
    `;

    reviewList.appendChild(card);
  });
}

// ============================================================
// WATCH MOVIE
// ============================================================

function watchMovie(movie) {
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  let currentUser = null;

  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser"));
  } catch (error) {
    currentUser = null;
  }

  // ==========================================================
  // LOGIN CHECK
  // ==========================================================

  if (isLoggedIn !== "true" || !currentUser) {
    alert("Please login first to watch movies!");

    localStorage.setItem("selectedMovie", movie.slug);

    window.location.href = "login.html";

    return;
  }

  // ==========================================================
  // WATCH HISTORY
  // ==========================================================

  let watchHistory = [];

  try {
    watchHistory = JSON.parse(localStorage.getItem("watchHistory")) || [];

    if (!Array.isArray(watchHistory)) {
      watchHistory = [];
    }
  } catch (error) {
    watchHistory = [];
  }

  watchHistory.push({
    name: currentUser.name,

    email: currentUser.email,

    movie: movie.title,

    movieId: movie.id,

    slug: movie.slug,

    watchedAt: new Date().toLocaleString(),
  });

  localStorage.setItem("watchHistory", JSON.stringify(watchHistory));

  // ==========================================================
  // OPEN WATCH PAGE
  // ==========================================================

  window.location.href = `watch.html?movie=${encodeURIComponent(movie.slug)}`;
}

// ============================================================
// THEME
// ============================================================

function loadTheme() {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "light") {
    document.body.classList.add("light-mode");

    if (themeToggle) {
      themeToggle.textContent = "☀ Light Mode";
    }
  } else {
    document.body.classList.remove("light-mode");

    if (themeToggle) {
      themeToggle.textContent = "🌙 Dark Mode";
    }
  }
}

// ============================================================
// TOGGLE THEME
// ============================================================

function toggleTheme() {
  document.body.classList.toggle("light-mode");

  if (document.body.classList.contains("light-mode")) {
    localStorage.setItem("theme", "light");

    if (themeToggle) {
      themeToggle.textContent = "☀ Light Mode";
    }
  } else {
    localStorage.setItem("theme", "dark");

    if (themeToggle) {
      themeToggle.textContent = "🌙 Dark Mode";
    }
  }
}

// ============================================================
// LOGOUT
// ============================================================

function logoutUser() {
  try {
    localStorage.removeItem("isLoggedIn");

    localStorage.removeItem("isAdmin");

    localStorage.removeItem("currentUser");

    localStorage.removeItem("selectedMovie");

    alert("Logged out successfully!");

    window.location.href = "index.html";
  } catch (error) {
    console.error("Logout error:", error);

    alert("Logout failed!");
  }
}

// ============================================================
// INITIALIZE APP
// ============================================================

function initApp() {
  // DOM elements

  movieList = document.getElementById("movie-list");

  favoriteList = document.getElementById("favorite-list");

  userList = document.getElementById("user-list");

  reviewList = document.getElementById("review-list");

  searchInput = document.getElementById("searchInput");

  genreFilter = document.getElementById("genreFilter");

  themeToggle = document.getElementById("theme-toggle");

  // ==========================================================
  // BUTTONS
  // ==========================================================

  const browseBtn = document.getElementById("browse-btn");

  const usersBtn = document.getElementById("users-btn");

  const loginBtn = document.getElementById("login-btn");

  const logoutBtn = document.getElementById("logout-btn");

  const menuToggle = document.getElementById("menu-toggle");

  const navbar = document.getElementById("navbar");

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  loadTheme();

  showUsers();

  showReviews();

  // Movies come from MySQL
  loadMovies();

  // ==========================================================
  // SEARCH
  // ==========================================================

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }

  // ==========================================================
  // GENRE FILTER
  // ==========================================================

  if (genreFilter) {
    genreFilter.addEventListener("change", applyFilters);
  }

  // ==========================================================
  // THEME
  // ==========================================================

  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  // ==========================================================
  // BROWSE BUTTON
  // ==========================================================

  if (browseBtn) {
    browseBtn.addEventListener("click", () => {
      document.getElementById("movies")?.scrollIntoView({
        behavior: "smooth",
      });
    });
  }

  // ==========================================================
  // USERS BUTTON
  // ==========================================================

  if (usersBtn) {
    usersBtn.addEventListener("click", () => {
      document.getElementById("users")?.scrollIntoView({
        behavior: "smooth",
      });
    });
  }

  // ==========================================================
  // LOGIN / LOGOUT BUTTON
  // ==========================================================

  const isLoggedIn = localStorage.getItem("isLoggedIn");

  if (loginBtn) {
    loginBtn.style.display = isLoggedIn === "true" ? "none" : "inline-block";
  }

  if (logoutBtn) {
    logoutBtn.style.display = isLoggedIn === "true" ? "inline-block" : "none";

    logoutBtn.addEventListener("click", logoutUser);
  }

  // ==========================================================
  // MOBILE MENU
  // ==========================================================

  if (menuToggle && navbar) {
    menuToggle.addEventListener("click", function () {
      navbar.classList.toggle("active");

      if (navbar.classList.contains("active")) {
        menuToggle.textContent = "✖";
      } else {
        menuToggle.textContent = "☰";
      }
    });

    const navLinks = navbar.querySelectorAll("a");

    navLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth <= 768) {
          navbar.classList.remove("active");

          menuToggle.textContent = "☰";
        }
      });
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 768) {
        navbar.classList.remove("active");

        menuToggle.textContent = "☰";
      }
    });
  }
}

// ============================================================
// START APP
// ============================================================

document.addEventListener("DOMContentLoaded", initApp);
