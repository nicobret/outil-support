import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default () => {
  // plugins array
  let plugins = [react({ plugins: [["@swc/plugin-styled-components", {}]] })];

  if (process.env.PRODUCTION || process.env.STAGING) {
    plugins.push(
      sentryVitePlugin({
        include: ".",
        ignore: ["node_modules", "vite.config.ts"],
        org: "sentry",
        project: process.env.PRODUCTION === "true" ? "snu-production" : "snu-staging",
        authToken: process.env.SENTRY_AUTH_TOKEN,
        url: "https://sentry.selego.co/",
        deploy: {
          env: "support",
        },
        sourceMaps: {
          include: ["./dist/assets"],
          ignore: ["node_modules"],
          urlPrefix: "~/assets",
        },
        setCommits: {
          auto: true,
        },
      })
    );
  }

  return defineConfig({
    // the rest of the configuration goes here
    server: {
      port: 8083,
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const HugeLibraries = ["react-dom", "react-router-dom", "react-redux", "emoji-mart", "slate", "slate-react", "xlsx", "validator"];
            if (HugeLibraries.some((libName) => id.includes(`node_modules/${libName}`))) {
              return id.toString().split("node_modules/")[1].split("/")[0].toString();
            }
          },
        },
      },
    },
    plugins: plugins,
  });
};
