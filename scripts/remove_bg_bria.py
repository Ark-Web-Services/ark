import os
import glob
from PIL import Image
import torch
from transformers import pipeline

def process_bria(input_dir, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print("Loading BRIA RMBG 2.0 model...")
    # This will download the model (~150MB) on first run
    pipe = pipeline("image-segmentation", model="briaai/RMBG-2.0", trust_remote_code=True, device="cpu")

    files = glob.glob(os.path.join(input_dir, "*.png"))
    print(f"Found {len(files)} files to process.")

    for i, file_path in enumerate(files):
        filename = os.path.basename(file_path)
        output_path = os.path.join(output_dir, filename)

        if os.path.exists(output_path):
            print(f"[{i+1}/{len(files)}] Skipping {filename}")
            continue

        print(f"[{i+1}/{len(files)}] Processing {filename}...")
        try:
            # Process the image
            # pipe() returns a PIL Image with alpha channel for segmentation
            # But usually for RMBG it returns a mask or the actual segmented image depend on pipeline config
            # Let's use the PIL image directly
            pillow_mask = pipe(file_path)

            # pipe(file_path) with image-segmentation usually returns a list of results or a single PIL image
            # For briaai/RMBG-2.0 it returns the result image directly
            pillow_mask.save(output_path)

            print(f"      Saved to {filename}")
        except Exception as e:
            print(f"      Error processing {filename}: {e}")

if __name__ == "__main__":
    input_folder = os.environ.get("BACKGROUND_INPUT_DIR", os.path.join(os.getcwd(), "input"))
    output_folder = os.environ.get("BACKGROUND_OUTPUT_DIR", os.path.join(os.getcwd(), "output"))
    process_bria(input_folder, output_folder)
