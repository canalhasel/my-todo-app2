import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // CLI（db push / migrate）は Pooler を経由しない直接接続を使う
    url: process.env["DIRECT_URL"],
  },
});
