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

        function equal(a, b) {
            return a.x == b.x && a.y == b.y;
        }

        function dist(a, b) {
            return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
        }

        function costEstimate(start, goal) {
            return dist(start, goal);
        }

        function lowestCost(nodes, cost) {
            var lowest = nodes[0];

            for(var i=0; i < nodes.length; i++) {
                var n = nodes[i];
                if(cost[JSON.stringify(n)] < cost[JSON.stringify(lowest)]) { lowest = n; }
            }

            return lowest;
        }

        function getNeighbors(node) {
            return [
                {x: node.x, y: node.y+1},
                {x: node.x, y: node.y-1},
                {x: node.x+1, y: node.y},
                {x: node.x+1, y: node.y+1},
                {x: node.x+1, y: node.y-1},
                {x: node.x-1, y: node.y},
                {x: node.x-1, y: node.y+1},
                {x: node.x-1, y: node.y-1}
            ];
        }

        function getValidNeighbors(node) {
            var candidates = getNeighbors(node);

            var survivors = [];
            for(var i = 0; i < candidates.length; i++) {
                var c = candidates[i];
                var col = get(c.x, c.y);

                if(col.r > 0 || col.g > 0 || col.b > 0) continue;
                if(c.x < 0 || c.x > canvas.width || c.y < 0 || c.y > canvas.height) continue;

                survivors.push(c);
            }

            return survivors;
        }

        function path(previous, current) {
            var thepath = [current];

            while(previous[JSON.stringify(current)] !== undefined) {
                current = previous[JSON.stringify(current)];
                thepath.push(current);
            }

            return thepath;
        }

        function containsNode(list, node) {
            for(var i = 0; i < list.length; i++) {
                if(equal(list[i], node)) {
                    return true;
                }
            }

            return false;
        }

        function findPath(start, goal) {
            var s = JSON.stringify;

            var evaluated = [];
            var next = [start];
            var previous = {};

            var cost = {};
            cost[s(start)] = 0;
            var costThrough = {};
            costThrough[s(start)] = cost[s(start)] + costEstimate(start, goal);

            while(next.length != 0) {
                var current = lowestCost(next, costThrough);

                //console.log(goal.x - current.x, goal.y - current.y, equal(current, goal));
                if(equal(current, goal)) {
                    return path(previous, goal);
                }

                var index = next.indexOf(current);
                next.splice(index, 1);

                if(!containsNode(evaluated, current))
                    evaluated.push(current);

                var neighbors = getValidNeighbors(current);

                for(var i = 0; i < neighbors.length; i++) {
                    var neighbor = neighbors[i];

                    // if we haven't looked at this neighbor
                    if(!containsNode(evaluated, neighbor)) {
                        // cumulative cost of path to this neighbor
                        var neighborCost = cost[s(current)] + dist(current, neighbor);

                        getNeighbors(neighbor).forEach(function(n) {
                            var col = get(n.x, n.y);

                            if(col.r > 0 || col.g > 0 || col.b > 0)
                                neighborCost += 4;
                        });

                        if(!containsNode(next, neighbor) || neighborCost < cost[s(neighbor)]) {
                            previous[s(neighbor)] = current;

                            cost[s(neighbor)] = neighborCost;
                            costThrough[s(neighbor)] = cost[s(neighbor)] + costEstimate(neighbor, goal);

                            if(!containsNode(next, neighbor)) {
                                next.push(neighbor);
                            }
                        }
                    }
                }
            }

            return [];
        }

        findPath({x: x1, y: y1}, {x: x2, y: y2}).forEach(function(node) {
            set(node.x, node.y, 255, 255, 255);
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
