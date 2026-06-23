import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
  },
  withCredentials: true,
  withXSRFToken: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export async function csrfCookie(): Promise<void> {
  await axios.get("/sanctum/csrf-cookie", {
    withCredentials: true,
    withXSRFToken: true,
  });
}

export default api;
