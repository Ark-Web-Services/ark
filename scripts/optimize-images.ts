import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";

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

async function optimizeImages() {
  console.log("Optimizing images to WebP format...");
  // Use relative path from project root
  const imagesDir = path.resolve("./public/assets/images");

  try {
    const files = await getFiles(imagesDir);
    const imageFiles = files.filter((f) => /\.(png|jpg|jpeg)$/i.test(f));

    console.log(`Found ${imageFiles.length} images to optimize.`);

    let successCount = 0;

    for (const file of imageFiles) {
      const dir = path.dirname(file);
      const ext = path.extname(file);
      let basename = path.basename(file, ext);

      // Handle the case where the file was maliciously double-named like image.jpg.png
      if (basename.endsWith('.jpg')) {
          basename = basename.slice(0, -4);
      } else if (basename.endsWith('.jpeg')) {
          basename = basename.slice(0, -5);
      }

      const newFile = path.join(dir, `${basename}.webp`);

      try {
        await sharp(file)
          .webp({ quality: 80, effort: 6 })
          .toFile(newFile);

        await fs.unlink(file);
        successCount++;
        console.log(`✅ Optimized: ${path.basename(file)} -> ${basename}.webp`);
      } catch (err) {
        console.error(`❌ Error optimizing ${file}:`, err);
      }
    }

    console.log(
      `\nOptimization complete. Successfully processed ${successCount}/${imageFiles.length} images.`
    );
  } catch (error) {
    console.error("Failed to process directory:", error);
  }
}

optimizeImages();
