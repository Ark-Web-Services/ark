import cv2
import numpy as np
import os

def create_mask(output_path, width=1024, height=1024):
    # Create a completely black mask
    mask = np.zeros((height, width), dtype=np.uint8)

    # Paint a white rectangle where the watermark sits (bottom-right 200x45)
    mask[height-45:height, width-200:width] = 255

    # Save the mask
    cv2.imwrite(output_path, mask)
    print(f"Mask created at: {output_path}")

if __name__ == "__main__":
    assets_dir = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "images")
    mask_path = os.path.join(assets_dir, "dalle_mask.png")
    create_mask(mask_path)
