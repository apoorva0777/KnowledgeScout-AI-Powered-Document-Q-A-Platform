import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000", // Node backend (or Django at 8000)
});

// upload document
export const uploadDocument = (formData) =>
  API.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// query document
export const queryDocument = (data) => API.post("/query", data);
