import cv2
from rembg import remove
import numpy as np
import os

input_path = os.environ.get("BACKGROUND_TEST_INPUT", os.path.join(os.getcwd(), "input", "test.png"))
output_path = os.environ.get("BACKGROUND_TEST_OUTPUT", os.path.join(os.getcwd(), "output", "test.png"))

print("Reading image...")
img = cv2.imread(input_path)
if img is None:
    print("Failed to read image")
    exit(1)

print("Removing background...")
# Use u2net for testing
out = remove(img)

print("Writing image...")
cv2.imwrite(output_path, out)
print("Done")
