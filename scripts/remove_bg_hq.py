import os
import torch
import torch.nn.functional as F
from torchvision.transforms.functional import normalize
import numpy as np
from PIL import Image
from transformers import AutoModelForImageSegmentation

# Performance optimization: use MPS (Apple Silicon GPU) if available
device = "mps" if torch.backends.mps.is_available() else "cpu"
print(f"Using device: {device}")

def load_model():
    # BiRefNet is a powerful non-gated model
    model = AutoModelForImageSegmentation.from_pretrained("ZhengPeng7/BiRefNet", trust_remote_code=True)
    model.to(device)
    model.eval()
    return model

def process_image(model, input_path, output_path):
    # Prepare image
    orig_im = Image.open(input_path)
    w, h = orig_im.size

    # Preprocess
    im = orig_im.convert("RGB")
    im_tensor = torch.from_numpy(np.array(im).astype(np.float32)).permute(2,0,1).unsqueeze(0)
    im_tensor = im_tensor / 255.0
    im_tensor = normalize(im_tensor, [0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    im_tensor = im_tensor.to(device)

    # Inference
    with torch.no_grad():
        # BiRefNet usually works best at 1024x1024
        im_tensor_resized = F.interpolate(im_tensor, size=(1024, 1024), mode='bilinear', align_corners=False)
        preds = model(im_tensor_resized)[-1].sigmoid().cpu() # Get last scale and apply sigmoid

    # Postprocess
    result = F.interpolate(preds, size=(h, w), mode='bilinear', align_corners=False)
    result = result.squeeze().numpy()

    # Create mask (0-1)
    mask = (result * 255).astype(np.uint8)

    # Apply to image
    alpha = Image.fromarray(mask, mode='L')
    orig_im.putalpha(alpha)

    # Save as PNG
    orig_im.save(output_path, "PNG")

if __name__ == "__main__":
    input_dir = os.environ.get("BACKGROUND_INPUT_DIR", os.path.join(os.getcwd(), "input"))
    output_dir = os.environ.get("BACKGROUND_OUTPUT_DIR", os.path.join(os.getcwd(), "output"))

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print("Loading BiRefNet model (state-of-the-art HQ removal)...")
    model = load_model()

    files = [f for f in os.listdir(input_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    print(f"Found {len(files)} files.")

    for i, filename in enumerate(files):
        print(f"[{i+1}/{len(files)}] Processing {filename}...")
        try:
            in_path = os.path.join(input_dir, filename)
            out_path = os.path.join(output_dir, filename)
            process_image(model, in_path, out_path)
            # Print size to verify it didn't nuked everything
            file_size_kb = os.path.getsize(out_path) / 1024
            print(f"   Success! Output size: {file_size_kb:.1f} KB")
        except Exception as e:
            print(f"   Error processing {filename}: {e}")
