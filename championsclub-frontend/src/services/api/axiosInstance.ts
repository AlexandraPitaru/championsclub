import axios from "axios";


const axiosInstance = axios.create();

// Adaugă X-User-Id la fiecare request dacă există în localStorage
axiosInstance.interceptors.request.use((config) => {
  const userId = localStorage.getItem("user_id");
  if (userId) {
    config.headers = config.headers || {};
    config.headers["X-User-Id"] = userId;
  }
  return config;
});

export default axiosInstance;
