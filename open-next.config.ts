import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";

export default {
  ...defineCloudflareConfig({
    enableCacheInterception: false,
  }),
  buildCommand: "npx next build",
};
