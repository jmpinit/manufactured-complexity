#!/usr/bin/env python

from __future__ import print_function
import sys, os.path
from PIL import Image

colorSwaps = {
    (0, 255, 0): (0, 0, 0), # box color

    # ports
    (255, 0, 0): (0, 0, 0),
    (0, 0, 255): (255, 255, 255)
}

outputFilename = ""

# parse CLI arguments

if len(sys.argv) == 3:
    inputFilename = sys.argv[1]
    outputFilename = sys.argv[2]
else:
    print("usage: <input image file> <output image file>", file=sys.stderr)
    exit(1)

if not os.path.isfile(inputFilename):
    print("input file does not exist!", file=sys.stderr)
    exit(1)

# strip image

def strip(image):
    width, height = image.size
    pixels = image.load()

    for y in range(0, height):
        for x in range(0, width):
            color = inputImage.getpixel((x, y))

            if color in colorSwaps:
                pixels[x, y] = colorSwaps[color]

inputImage = Image.open(inputFilename).convert('RGB')

strip(inputImage)

inputImage.save(outputFilename)
