import axios from "axios";


const axiosInstance = axios.create();

// Adaugă X-User-Id la fiecare request dacă există în localStorage
axiosInstance.interceptors.request.use((config) => {
  let userId = localStorage.getItem("user_id");
  // Fallback pentru development/local: dacă nu există user_id, folosește "1"
  if (!userId && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    userId = "1";
  }
  if (userId) {
    config.headers = config.headers || {};
    config.headers["X-User-Id"] = userId;
  }
  return config;
});

export default axiosInstance;
