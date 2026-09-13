const movieTitle = document.getElementById("movie-title");
const videoBox = document.getElementById("video-box");

const isLoggedIn = localStorage.getItem("isLoggedIn");
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (isLoggedIn !== "true" || !currentUser) {
  alert("Please login first to watch movies!");
  window.location.href = "login.html";
}

const params = new URLSearchParams(window.location.search);
const movie = params.get("movie")?.toLocaleLowerCase();

const movies = {
  dangal: {
    title: "Dangal",
    youtube: "https://www.youtube.com/embed/x_7YlGv9u1g",
  },
  interstellar: {
    title: "Interstellar",
    youtube: "https://www.youtube.com/embed/zSWdZVtXT7E?autoplay=1&rel=0",
  },
  "3idiots": {
    title: "3 Idiots",
    youtube: "https://www.youtube.com/embed/K0eDlFX9GMc?autoplay=1&rel=0",
  },
  kgf: {
    title: "KGF",
    youtube: "https://www.youtube.com/embed/qXgF-iJ_ezE?autoplay=1&rel=0",
  },
};

if (!movie || !movies[movie]) {
  movieTitle.textContent = "Movie Not Found";
  videoBox.innerHTML = "<p style='padding:20px;'>Movie not available.</p>";
} else {
  const selectedMovie = movies[movie];
  movieTitle.textContent = selectedMovie.title;

  videoBox.innerHTML = `
<iframe
    width="100%"
    height="500"
    src="${selectedMovie.youtube}"
    title="${selectedMovie.title}"
    frameborder="0"
    allow="autoplay; encrypted-media; fullscreen"
    allowfullscreen>
</iframe>

  `;
}
