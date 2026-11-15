import os
import glob
import cv2
import numpy as np

def generate_exact_masks(img_dir, mask_dir):
    os.makedirs(mask_dir, exist_ok=True)

    extensions = ['*.png', '*.jpg', '*.webp']
    files_to_process = []
    for ext in extensions:
        files_to_process.extend(glob.glob(os.path.join(img_dir, ext)))

    for file_path in files_to_process:
        try:
            img = cv2.imread(file_path)
            if img is None:
                continue

            h, w = img.shape[:2]
            if h < 200 or w < 200:
                continue

            # Create the exact same size mask
            mask = np.zeros((h, w), dtype=np.uint8)

            # Bottom-right watermark area (padding safely by setting 250x65)
            mask[h-65:h, w-250:w] = 255

            # Save the mask into the mask directory with the EXACT same filename
            filename = os.path.basename(file_path)
            mask_out = os.path.join(mask_dir, filename)
            cv2.imwrite(mask_out, mask)

            print(f"Generated {w}x{h} mask for: {filename}")

        except Exception as e:
            print(f"Error making mask for {file_path}: {e}")

if __name__ == "__main__":
    base_dir = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "images")
    posts_dir = os.path.join(base_dir, "posts")
    masks_dir = os.path.join(base_dir, "masks")

    print("Generating exact-dimension masks...")
    generate_exact_masks(posts_dir, masks_dir)
    print("Done! You can now use the masks directory for iopaint.")
