// vite.config.js
import { defineConfig } from "file:///C:/Users/srima/OneDrive/Desktop/fynd/first-extension/frontend/node_modules/vite/dist/node/index.js";
import { dirname } from "path";
import { fileURLToPath } from "url";
import tailwindcss from "file:///C:/Users/srima/OneDrive/Desktop/fynd/first-extension/frontend/node_modules/@tailwindcss/vite/dist/index.mjs";
import react from "file:///C:/Users/srima/OneDrive/Desktop/fynd/first-extension/frontend/node_modules/@vitejs/plugin-react/dist/index.mjs";
var __vite_injected_original_import_meta_url = "file:///C:/Users/srima/OneDrive/Desktop/fynd/first-extension/frontend/vite.config.js";
var proxyOptions = {
  target: `http://127.0.0.1:${process.env.BACKEND_PORT}`,
  changeOrigin: false,
  secure: true,
  ws: false
};
var host = process.env.HOST ? process.env.HOST.replace(/https?:\/\//, "") : "localhost";
var hmrConfig;
if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host,
    port: process.env.FRONTEND_PORT,
    clientPort: 443
  };
}
var vite_config_default = defineConfig({
  root: dirname(fileURLToPath(__vite_injected_original_import_meta_url)),
  plugins: [react(), tailwindcss()],
  resolve: {
    preserveSymlinks: true
  },
  build: {
    outDir: "public/dist"
  },
  server: {
    host: "localhost",
    port: process.env.FRONTEND_PORT,
    proxy: {
      "^/(\\?.*)?$": proxyOptions,
      "^/api(/|(\\?.*)?$)": proxyOptions,
      "^/fp(/|(\\?.*)?$)": proxyOptions,
      "^/adm(/|(\\?.*)?$)": proxyOptions
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzcmltYVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXGZ5bmRcXFxcZmlyc3QtZXh0ZW5zaW9uXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzcmltYVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXGZ5bmRcXFxcZmlyc3QtZXh0ZW5zaW9uXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9zcmltYS9PbmVEcml2ZS9EZXNrdG9wL2Z5bmQvZmlyc3QtZXh0ZW5zaW9uL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7IGltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgeyBkaXJuYW1lIH0gZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tIFwidXJsXCI7XG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XG5cbmNvbnN0IHByb3h5T3B0aW9ucyA9IHtcbiAgdGFyZ2V0OiBgaHR0cDovLzEyNy4wLjAuMToke3Byb2Nlc3MuZW52LkJBQ0tFTkRfUE9SVH1gLFxuICBjaGFuZ2VPcmlnaW46IGZhbHNlLFxuICBzZWN1cmU6IHRydWUsXG4gIHdzOiBmYWxzZSxcbn07XG5cbmNvbnN0IGhvc3QgPSBwcm9jZXNzLmVudi5IT1NUXG4gID8gcHJvY2Vzcy5lbnYuSE9TVC5yZXBsYWNlKC9odHRwcz86XFwvXFwvLywgXCJcIilcbiAgOiBcImxvY2FsaG9zdFwiO1xuXG5cblxubGV0IGhtckNvbmZpZztcbmlmIChob3N0ID09PSBcImxvY2FsaG9zdFwiKSB7XG4gIGhtckNvbmZpZyA9IHtcbiAgICBwcm90b2NvbDogXCJ3c1wiLFxuICAgIGhvc3Q6IFwibG9jYWxob3N0XCIsXG4gICAgcG9ydDogNjQ5OTksXG4gICAgY2xpZW50UG9ydDogNjQ5OTksXG4gIH07XG59IGVsc2Uge1xuICBobXJDb25maWcgPSB7XG4gICAgcHJvdG9jb2w6IFwid3NzXCIsXG4gICAgaG9zdDogaG9zdCxcbiAgICBwb3J0OiBwcm9jZXNzLmVudi5GUk9OVEVORF9QT1JULFxuICAgIGNsaWVudFBvcnQ6IDQ0MyxcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcm9vdDogZGlybmFtZShmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCkpLFxuICBwbHVnaW5zOiBbcmVhY3QoKSwgdGFpbHdpbmRjc3MoKV0sXG4gIHJlc29sdmU6IHtcbiAgICBwcmVzZXJ2ZVN5bWxpbmtzOiB0cnVlLFxuICB9LFxuICBidWlsZDoge1xuICAgIG91dERpcjogJ3B1YmxpYy9kaXN0J1xuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiBcImxvY2FsaG9zdFwiLFxuICAgIHBvcnQ6IHByb2Nlc3MuZW52LkZST05URU5EX1BPUlQsXG4gICAgcHJveHk6IHtcbiAgICAgIFwiXi8oXFxcXD8uKik/JFwiOiBwcm94eU9wdGlvbnMsXG4gICAgICBcIl4vYXBpKC98KFxcXFw/LiopPyQpXCI6IHByb3h5T3B0aW9ucyxcbiAgICAgIFwiXi9mcCgvfChcXFxcPy4qKT8kKVwiOiBwcm94eU9wdGlvbnMsXG4gICAgIFwiXi9hZG0oL3woXFxcXD8uKik/JClcIjogcHJveHlPcHRpb25zLFxuICAgIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMFgsU0FBUyxvQkFBb0I7QUFDdlosU0FBUyxlQUFlO0FBQ3hCLFNBQVMscUJBQXFCO0FBQzlCLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sV0FBVztBQUorTixJQUFNLDJDQUEyQztBQU1sUyxJQUFNLGVBQWU7QUFBQSxFQUNuQixRQUFRLG9CQUFvQixRQUFRLElBQUksWUFBWTtBQUFBLEVBQ3BELGNBQWM7QUFBQSxFQUNkLFFBQVE7QUFBQSxFQUNSLElBQUk7QUFDTjtBQUVBLElBQU0sT0FBTyxRQUFRLElBQUksT0FDckIsUUFBUSxJQUFJLEtBQUssUUFBUSxlQUFlLEVBQUUsSUFDMUM7QUFJSixJQUFJO0FBQ0osSUFBSSxTQUFTLGFBQWE7QUFDeEIsY0FBWTtBQUFBLElBQ1YsVUFBVTtBQUFBLElBQ1YsTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLEVBQ2Q7QUFDRixPQUFPO0FBQ0wsY0FBWTtBQUFBLElBQ1YsVUFBVTtBQUFBLElBQ1Y7QUFBQSxJQUNBLE1BQU0sUUFBUSxJQUFJO0FBQUEsSUFDbEIsWUFBWTtBQUFBLEVBQ2Q7QUFDRjtBQUVBLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE1BQU0sUUFBUSxjQUFjLHdDQUFlLENBQUM7QUFBQSxFQUM1QyxTQUFTLENBQUMsTUFBTSxHQUFHLFlBQVksQ0FBQztBQUFBLEVBQ2hDLFNBQVM7QUFBQSxJQUNQLGtCQUFrQjtBQUFBLEVBQ3BCO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTSxRQUFRLElBQUk7QUFBQSxJQUNsQixPQUFPO0FBQUEsTUFDTCxlQUFlO0FBQUEsTUFDZixzQkFBc0I7QUFBQSxNQUN0QixxQkFBcUI7QUFBQSxNQUN0QixzQkFBc0I7QUFBQSxJQUN2QjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
