import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/RSVP_Reader/",
  plugins: [react()],
});
