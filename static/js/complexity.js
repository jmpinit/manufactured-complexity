complexity = {
    metadata: undefined,
    spritesheet: undefined,

    load: function(cb) {
        var spriteTask = $.Deferred();
        var metaTask = $.Deferred();

        var spritesheet = new Image();
        spritesheet.src = '/assets/devices.png';
        spritesheet.addEventListener("load", function() {
            complexity.spritesheet = spritesheet;
            spriteTask.resolve();
        }, false);

        $.getJSON("/assets/devices.json", function(data) {
            complexity.metadata = data;
            metaTask.resolve();
        });

        // callback when all assets are loaded
        $.when(spriteTask, metaTask).done(function() { cb(); });
    },

    manufacture: function(canvas) {
    },

    debug: {
        drawDevices: function(canvas, scale) {
            if(scale === undefined) scale = 1;

            var ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;

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

                x += gridWidth;
                if(x > canvas.width) {
                    x = 0;
                    y += gridHeight;
                }
            }
        }
    }
}
