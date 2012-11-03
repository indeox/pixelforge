app = {
    initialize: function() {
        var self = this;

        this.blockSize = '30x30';
        this.finalWidth = 960;
        this.canvasEl = $('canvas')[0];

        $('input[name=blocksize]').val(this.blockSize);
        $('input[name=blocksize]').change(function(e) {
            self.blockSize = $(this).val();
            self.getImageData(self.blockSize);
        });

        $('input[name=finalwidth]').val(this.finalWidth);
        $('input[name=finalwidth]').change(function(e) {
            self.finalWidth = $(this).val();
            self.resizeToWidth(self.finalWidth);
            self.getImageData(self.blockSize);
        });


        $('.show-markup').click(function(e) {
            e.preventDefault();
            $('.output-table-html').toggle();
        });

        $('#imageloader')[0].addEventListener('change', this.handleImage, false);

        // Select all text in a textarea on the first click
        $('textarea').focus(function() {
            var $this = $(this);
            $this.select();

            // Work around Chrome's little problem
            $this.mouseup(function() {
                // Prevent further mouseup intervention
                $this.unbind("mouseup");
                return false;
            });
        });
    },

    handleImage: function(e) {
        var reader = new FileReader();
        reader.onload = function(event){
            $('.upload p').html('working...');
            $('.upload').addClass('activity');
            app.loadImage(event.target.result);
        };
        reader.readAsDataURL(e.target.files[0]);
    },

    loadImage: function(src) {
        var self = this;
        this.context = this.canvasEl.getContext('2d');

        this.imageObj = new Image();

        this.imageObj.onload = function() {
            self.resizeToWidth(self.finalWidth);

            // Load the image data
            self.getImageData(self.blockSize);
        };
        this.imageObj.src = src;
    },

    resizeToWidth: function(finalWidth) {
        var self = this,
            targetW = finalWidth,
            targetH = Math.round(targetW / (self.imageObj.width / self.imageObj.height));

        $(self.canvasEl).width(targetW)
                        .height(targetH)
                        .attr('width', targetW)
                        .attr('height', targetH);
        //console.log($(self.canvasEl).width());

        self.imageWidth  = targetW; //imageObj.width;
        self.imageHeight = targetH; //imageObj.height;
        self.context.drawImage(self.imageObj, 0, 0, targetW, targetH);
    },

    getImageData: function(size) {
        size = size.split('x');

        var self = this,
            blockWidth = parseInt(size[0], 10),
            blockHeight = parseInt(size[1], 10),
            row = 0,
            col = 0,
            colourTableArray = [];

        this.blockWidth = blockWidth;
        this.blockHeight = blockHeight;

        for (var y=0; y<=this.imageHeight; y+=blockHeight) {
            for (var x=0; x<=this.imageWidth; x+=blockWidth) {
                var imageData = this.context.getImageData(x, y, blockWidth, blockHeight);
                var averageColour = this.getAverageColour(imageData);

                if (colourTableArray[row] === undefined) { colourTableArray[row] = []; }
                colourTableArray[row][col] = averageColour;

                col += 1;
            }

            row += 1;
            col = 0;
        }

        self.buildTable(colourTableArray);
    },

    getAverageColour: function(imageData) {
        var data = imageData.data,
            length = imageData.data.length,
            rgb = {r:102, g:102, b:102},
            pixelInterval = 5,
            count = 0,
            i = -4;

        while ((i += pixelInterval * 4) < length) {
            count++;
            rgb.r += data[i];
            rgb.g += data[i+1];
            rgb.b += data[i+2];
        }

        // floor the average values to give correct rgb values (ie: round number values)
        rgb.r = (rgb.r/count > 255) ? 255 : Math.floor(rgb.r/count);
        rgb.g = (rgb.g/count > 255) ? 255 : Math.floor(rgb.g/count);
        rgb.b = (rgb.b/count > 255) ? 255 : Math.floor(rgb.b/count);

        return rgb;
    },

    buildTable: function(tableArray) {
        var self = this,
            node = $('.output-table'),
            html = '<table cellpadding="0" cellspacing="0" width="'+this.imageWidth+'" height="'+this.imageHeight+'" style="font-size: 0px">\n';

        for (var row in tableArray) {
            // Only add the width attribute to the first row, it's enough
            var widthAttr = (row === 0) ? ' width="'+this.blockWidth+'"' : '';

            row = tableArray[row];

            html += '  <tr height="'+this.blockHeight+'">\n';
            for (var col in row) {
                var cell = row[col];
                //html += '<td style="background-color: rgb('+cell.r+','+cell.g+','+cell.b+')">&nbsp;</td>';
                        //console.log(cell, rgbToHex(cell.r, cell.g, cell.b));

                html += '    <td'+widthAttr+' bgcolor="'+rgbToHex(cell.r, cell.g, cell.b)+'">&nbsp;</td>\n';
            }
            html += '  </tr>\n';
        }

        html += '</table>';


        // Do the pretty things
        $('.upload').fadeOut(500, function() {
            node.html(html);
            node.fadeIn(500);

            $('.actions').fadeIn(500);
        });

        $('.output-table-html').val(html);
    }
};


$(function() {
    app.initialize();
});



// Utils
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
