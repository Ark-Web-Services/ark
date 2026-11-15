import os
import glob
from rembg import remove
from PIL import Image

def process_folder(input_dir, output_dir, model_name="isnet-general-use"):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    files = glob.glob(os.path.join(input_dir, "*.png"))
    print(f"Found {len(files)} files to process.")

    from rembg import new_session
    session = new_session(model_name)

    for i, file_path in enumerate(files):
        filename = os.path.basename(file_path)
        output_path = os.path.join(output_dir, filename)

        if os.path.exists(output_path):
            print(f"[{i+1}/{len(files)}] Skipping {filename} (already exists)")
            continue

        print(f"[{i+1}/{len(files)}] Processing {filename}...")
        try:
            with open(file_path, 'rb') as i_file:
                input_data = i_file.read()
                output_data = remove(input_data, session=session)
                with open(output_path, 'wb') as o_file:
                    o_file.write(output_data)
            print(f"      Saved to {filename}")
        except Exception as e:
            print(f"      Error processing {filename}: {e}")

if __name__ == "__main__":
    input_folder = os.environ.get("BACKGROUND_INPUT_DIR", os.path.join(os.getcwd(), "input"))
    output_folder = os.environ.get("BACKGROUND_OUTPUT_DIR", os.path.join(os.getcwd(), "output"))
    process_folder(input_folder, output_folder, model_name="u2net")
