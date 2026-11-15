import cv2
import numpy as np
import os
import glob

def erase_watermarks(base_dir):
    # Search for all images in the assets folder
    extensions = ['*.png', '*.jpg', '*.webp']
    files_to_process = []

    for ext in extensions:
        files_to_process.extend(glob.glob(os.path.join(base_dir, '**', ext), recursive=True))

    for file_path in files_to_process:
        try:
            # Load the image using OpenCV
            img = cv2.imread(file_path)
            if img is None:
                continue

            h, w = img.shape[:2]

            # Skip images that are too small
            if h < 200 or w < 200:
                continue

            # Create a completely black mask the exact same size as the image
            mask = np.zeros((h, w), dtype=np.uint8)

            # Paint a white rectangle exactly where the DALL-E/AI watermark sits
            # (bottom-right corner, roughly 120 pixels wide and 45 pixels tall)
            mask[h-45:h, w-200:w] = 255

            # Use OpenCV's built-in "Content Aware Fill" (Telea algorithm)
            # This mathematically blends the surrounding pixels into the masked area
            erased_img = cv2.inpaint(img, mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)

            # Overwrite the original image
            cv2.imwrite(file_path, erased_img)
            print(f"Magically erased watermark from: {os.path.basename(file_path)}")

        except Exception as e:
            print(f"Error processing {os.path.basename(file_path)}: {e}")

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        target_dir = sys.argv[1]
    else:
        target_dir = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "images")

    if os.path.exists(target_dir):
         print(f"Starting magical inpainting on: {target_dir}")
         erase_watermarks(target_dir)
         print("Inpainting complete!")
    else:
         print(f"Directory not found: {target_dir}")
