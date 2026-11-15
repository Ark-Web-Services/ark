import { promises as fs } from "fs";
import path from "path";

async function getFiles(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : res;
    })
  );
  return Array.prototype.concat(...files);
}

async function migrateRefs() {
  console.log("Migrating image references to .webp...");
  const contentDir = path.resolve("./src/content/posts");
  const layoutsDir = path.resolve("./src/layouts");

  try {
    const mdFiles = await getFiles(contentDir);
    const layoutFiles = await getFiles(layoutsDir);
    const targetFiles = [...mdFiles, ...layoutFiles].filter(f => /\.(md|astro)$/i.test(f));

    let updatedCount = 0;

    for (const file of targetFiles) {
      const content = await fs.readFile(file, "utf8");

      // Update image meta/frontmatter and tags like <img src="...png">
      // Make sure we only target .jpg/.png inside /assets/images/
      const newContent = content
        .replace(/\/assets\/images\/(.*)\.(jpg|png)/g, "/assets/images/$1.webp")
        .replace(/image: \/assets\/images\/(.*)\.(jpg|png)/g, "image: /assets/images/$1.webp");

      if (content !== newContent) {
        await fs.writeFile(file, newContent, "utf8");
        updatedCount++;
        // console.log(`Upadted refs in: ${path.basename(file)}`);
      }
    }

    console.log(`Successfully updated ${updatedCount} files.`);
  } catch (error) {
    console.error("Failed to migrate references:", error);
  }
}

migrateRefs();
