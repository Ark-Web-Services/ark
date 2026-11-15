import os
import glob
from PIL import Image

def remove_watermarks(base_dir):
    # Search for all PNG and JPG images in the assets folder recursively
    extensions = ['*.png', '*.jpg', '*.webp']
    files_to_process = []

    for ext in extensions:
        files_to_process.extend(glob.glob(os.path.join(base_dir, '**', ext), recursive=True))

    crop_pixels = 40  # The typical height of the DALL-E/AI watermark

    for file_path in files_to_process:
        try:
            with Image.open(file_path) as img:
                width, height = img.size

                # We skip images that are too small (like icons or favicons)
                if height < 200 or width < 200:
                    continue

                # Crop off the bottom 40 pixels
                cropped_img = img.crop((0, 0, width, height - crop_pixels))

                # Overwrite original
                cropped_img.save(file_path)
                print(f"Cropped watermark from: {os.path.basename(file_path)}")

        except Exception as e:
            print(f"Error processing {os.path.basename(file_path)}: {e}")

if __name__ == "__main__":
    assets_dir = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "images")
    if os.path.exists(assets_dir):
        print("Starting watermark removal...")
        remove_watermarks(assets_dir)
        print("Complete!")
    else:
        print(f"Directory not found: {assets_dir}")
