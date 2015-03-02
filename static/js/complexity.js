var pick = function(arr) {
    if(arr.length > 0) {
        return arr[Math.floor(Math.random() * arr.length)];
    } else {
        return undefined;
    }
}

var Device = function(box, x, y) {
    this.box = box;

    this.x = x;
    this.y = y;
}

complexity = {
    CONNECTIVITY: 0.5,

    metadata: undefined,
    spritesheet: undefined,

    load: function(cb) {
        var spriteTask = $.Deferred();
        var metaTask = $.Deferred();

        var spritesheet = new Image();
        spritesheet.src = '/images/devices.png';
        spritesheet.addEventListener("load", function() {
            complexity.spritesheet = spritesheet;
            spriteTask.resolve();
        }, false);

        $.getJSON("/data/devices.json", function(data) {
            complexity.metadata = data;
            metaTask.resolve();
        });

        // callback when all assets are loaded
        $.when(spriteTask, metaTask).done(function() { cb(); });
    },

    manufacture: function(canvas) {
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // draw background
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // pick some devices
        var devices = []
        for(var i = 0; i < 6; i++) {
            var x = Math.floor(Math.random() * canvas.width);
            var y = Math.floor(Math.random() * canvas.height);

            devices.push(new Device(pick(complexity.metadata.boxes), x, y));
        }

        // get ports
        var ports = [];
        devices.forEach(function(dev) {
            ports = ports.concat(dev.ports);
        });

        // draw devices
        devices.forEach(function(dev) {
            ctx.drawImage(complexity.spritesheet, dev.box.x, dev.box.y, dev.box.width, dev.box.height, dev.x, dev.y, dev.box.width, dev.box.height);
        });

        // randomly connect ports
        devices.forEach(function(dev) {
            dev.box.ports.forEach(function(p) {
                if(Math.random() < complexity.CONNECTIVITY) {
                    var otherDev = pick(devices); // TODO ensure not same device
                    var otherPort = pick(otherDev.box.ports);

                    if(otherPort !== undefined) {
                        var startX = dev.x + p.x;
                        var startY = dev.y + p.y;
                        var endX = otherDev.x + otherPort.x;
                        var endY = otherDev.y + otherPort.y;

                        complexity.connect(canvas, startX, startY, endX, endY);
                    }
                }
            });
        });
    },
    
    connect: function(canvas, x1, y1, x2, y2) {
        x1 = Math.floor(x1);
        y1 = Math.floor(y1);
        x2 = Math.floor(x2);
        y2 = Math.floor(y2);

        var ctx = canvas.getContext('2d');

        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var pixels = imageData.data;

        function set(x, y, r, g, b) {
            var i = 4 * (y * imageData.width + x);
            pixels[i  ] = r;
            pixels[i+1] = g;
            pixels[i+2] = b;
        }

        function get(x, y) {
            var i = 4 * (y * imageData.width + x);
            var r = pixels[i];
            var g = pixels[i+1];
            var b = pixels[i+2];

            return {'r': r, 'g': g, 'b': b};
        }

        var walkability = [];
        for(var y = 0; y < canvas.height; y++) {
            var row = [];
            for(var x = 0; x < canvas.width; x++) {
                var c = get(x, y);

                if(c.r > 0 || c.g > 0 || c.b > 0) {
                    row.push(1);
                } else {
                    row.push(0);
                }
            }
            walkability[y] = row;
        }

        function claustrophobia(x, y) {
            return  (x > 0)?
                        (1 - walkability[y][x-1]) : 1 +
                    (x < canvas.width-1)?
                        (1 - walkability[y][x+1]) : 1 +
                    (x > 0 && y > 0)?
                        (1 - walkability[y-1][x-1]) : 1 +
                    (y > 0)?
                        (1 - walkability[y-1][x]) : 1 +
                    (y > 0 && x < canvas.width-1)?
                        (1 - walkability[y-1][x+1]) : 1 +
                    (y < canvas.height-1 && x > 0)?
                        (1 - walkability[y+1][x-1]) : 1 +
                    (y < canvas.height-1)?
                        (1 - walkability[y+1][x]) : 1 +
                    (y < canvas.height-1 && x < canvas.width-1)?
                        (1 - walkability[y+1][x+1]) : 1;
        }

        var grid = new PF.Grid(canvas.width, canvas.height, walkability);
        var finder = new PF.AStarFinder({
            allowDiagonal: true,
            dontCrossCorners: true,
            heuristic: function(dx, dy) {
                var dist = Math.min(dx, dy);
                return dist + 10 * claustrophobia(dx, dy);
            }
        });
        var path = finder.findPath(x1, y1, x2, y2, grid);

        set(x1, y1, 255, 255, 255);
        path.forEach(function(coord) {
            set(coord[0], coord[1], 255, 255, 255);
        });

        ctx.putImageData(imageData, 0, 0);
    },

    debug: {
        drawDevices: function(canvas, scale) {
            if(scale === undefined) scale = 1;

            var ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;

            // draw background
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // draw devices

            var boxes = complexity.metadata.boxes;

            var maxWidth = 0;
            var maxHeight = 0;

            for(var i in boxes) {
                var box = boxes[i];
                if(box.width > maxWidth) maxWidth = box.width;
                if(box.height > maxHeight) maxHeight = box.height;
            }

            var gridWidth = maxWidth * scale;
            var gridHeight = maxHeight * scale;

            var x = 0, y = 0;

            for(var i in boxes) {
                var box = boxes[i];

                ctx.drawImage(complexity.spritesheet, box.x, box.y, box.width, box.height, x, y, box.width * scale, box.height * scale);

                for(var j in box.ports) {
                    var port = box.ports[j];

                    ctx.fillStyle = "#F00";
                    ctx.beginPath();
                    ctx.arc(x + port.x * scale + scale / 2, y + port.y * scale + scale / 2, scale / 2, 0, 2*Math.PI);
                    ctx.fill();
                }

                x += gridWidth;
                if(x > canvas.width) {
                    x = 0;
                    y += gridHeight;
                }
            }
        }
    }
}
