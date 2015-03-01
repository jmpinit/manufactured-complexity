#!/usr/bin/env python

from __future__ import print_function
import sys, os.path
from PIL import Image
import json

outputFilename = ""
outputToFile = False

# parse CLI arguments

if len(sys.argv) >= 2:
    inputFilename = sys.argv[1]

    if(len(sys.argv) == 3):
        outputToFile = True
        outputFilename = sys.argv[2]
else:
    print("usage: <input image file> <output json file>", file=sys.stderr)
    exit(1)

if not os.path.isfile(inputFilename):
    print("input file does not exist!", file=sys.stderr)
    exit(1)

# analyze image

inputImage = Image.open(inputFilename).convert('RGB')

width, height = inputImage.size
devicePositions = []
for y in range(0, height):
    for x in range(0, width):
        r, g, b = inputImage.getpixel((x, y))

        if g == 255:
            devicePositions += [{'x': x, 'y': y}]

outputObj = {'devices': devicePositions}
outputJSON = json.dumps(outputObj, sort_keys=True, indent=4, separators=(',', ': '))

outputFile = sys.stdout

if outputToFile:
    outputFile = open(outputFilename, 'w')

print(outputJSON, file=outputFile)
