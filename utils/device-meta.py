#!/usr/bin/env python

from __future__ import print_function
import sys, os.path
from PIL import Image
import json

boxColor = (0, 255, 0)

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

class BoundsError(Exception):
    def __init__(self, msg):
        self.message = msg

    def __str__(self):
        return self.message

def getBoxDimensions(image, x, y):
    width, height = image.size

    if x < 0 or y < 0 or x >= width or y >= height:
        raise BoundsError("Box origin not inside image.")

    boxWidth = 0
    boxHeight = 0

    # scan for width of box
    for scanX in range(x+1, width):
        color = image.getpixel((scanX, y))

        if color == boxColor:
            boxWidth = scanX - x
            break

    # scan for height of box
    for scanY in range(y+1, height):
        color = image.getpixel((x, scanY))

        if color == boxColor:
            boxHeight = scanY - y
            break

    if boxWidth == 0:
        raise BoundsError("Box width not found.")
    if boxHeight == 0:
        raise BoundsError("Box height not found.")

    return (boxWidth, boxHeight)

def getSpriteBoxes(image):
    width, height = image.size
    boxes = []
    taken = [] # points taken up by box corners

    for y in range(0, height):
        for x in range(0, width):
            color = inputImage.getpixel((x, y))

            if color == boxColor:
                if not (x, y) in taken:
                    try:
                        w, h = getBoxDimensions(image, x, y)
                        boxes += [{'x': x, 'y': y, 'width': w, 'height': h}]
                        taken += [(x, y), (x+w, y), (x, y+h), (x+w, y+h)]
                    except BoundsError as e:
                        print("Box out of bounds at ({}, {}): {}".format(x, y, str(e)), file=sys.stderr)
                        exit(1)
    return boxes

inputImage = Image.open(inputFilename).convert('RGB')

boxes = getSpriteBoxes(inputImage)

outputObj = {'boxes': boxes}
outputJSON = json.dumps(outputObj, sort_keys=True, indent=4, separators=(',', ': '))

outputFile = sys.stdout

if outputToFile:
    outputFile = open(outputFilename, 'w')

print(outputJSON, file=outputFile)
