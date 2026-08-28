import { execSync } from "child_process";
import { rmSync } from "fs";
import path from "path";

export default function globalSetup() {
  const dbFile = path.resolve(__dirname, "../prisma/test.db");
  rmSync(dbFile, { force: true });
  execSync("npx prisma db push --skip-generate", {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "inherit",
  });
}
