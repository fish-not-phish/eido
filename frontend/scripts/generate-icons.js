import fs from "fs";
import path from "path";

const dir = path.join(process.cwd(), "public/icons");
const files = fs.readdirSync(dir);

const icons = files
  .filter(f => f.endsWith(".png"))
  .map(f => f.replace(".png", ""));

fs.writeFileSync(
  path.join(process.cwd(), "public/icons.json"),
  JSON.stringify(icons, null, 2)
);

console.log(`✅ Generated icons.json with ${icons.length} icons`);
