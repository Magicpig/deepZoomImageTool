/**
 * Created by magicpig on 6/18/14.
 */
var images = require("images");
var async = require("async");
var fs = require("fs");
/**
 * make DeepZoom image
 * @param imageUrl
 * @param tileSize
 * @constructor
 */
function DeepZoom(imageUrl, tileSize, overLap) {
    this.Url = imageUrl;
    this.sourceImage = null;
    this.width = 0;
    this.height = 0;
    this.tileSize = 256;
    this.sourcePath = "";
    this.overLap = 1;
    if (imageUrl && typeof imageUrl == "string") {
        this.sourceImage = images(imageUrl);
    }
    if (tileSize) {
        this.tileSize = tileSize;
    }
    if (overLap) {
        this.overLap = overLap;
    }
    this.width = this.sourceImage.width();
    this.height = this.sourceImage.height();

}
/**
 * 获取图片需要多少层级深
 * @param width
 * @param height
 * @returns {number}
 */
DeepZoom.prototype.getMaximumLevel = function (width, height) {
    return Math.ceil(Math.log(Math.max(width, height)) / Math.LN2)
}
/**
 * 生成缩略图
 * @constructor
 */
DeepZoom.prototype.Make = function (sourcePath) {

    var _self = this;
    _self.sourcePath = sourcePath;
    _self.mkdir(sourcePath);
    this.CopySourceImage(this.getMaximumLevel(this.width, this.height));
    this.MakeThumbImages(function () {//生成景深缩略图
        _self.CorpImages();//图片分块  对景深缩略图进行分块处理
        _self.DeleteZoomSoureImage();//删除景深缩略图
    });
}
/**
 * 删除景深缩略图
 * @constructor
 */
DeepZoom.prototype.DeleteZoomSoureImage = function () {
    var maxLevel = this.getMaximumLevel(this.width, this.height);
    for (var i = 0; i <= maxLevel; i++) {
        var path = this.sourcePath + "/" + i + '.jpeg';
        if (fs.existsSync(path)) {
            fs.unlinkSync(path);
        }
    }
}
/**
 * 创建文件夹列表
 * @param sourcePath
 */
DeepZoom.prototype.mkdir = function (sourcePath) {
    if (!fs.existsSync("./" + sourcePath)) {//创建file目录
        fs.mkdirSync("./" + sourcePath);
    }
    var list = this.computeLevels(this.width, this.height, this.tileSize);
    for (var i = 0; i < list.length; i++) {//创建所有的子目录
        if (!fs.existsSync("./" + sourcePath + "/" + list[i].level)) {//创建file目录
            fs.mkdirSync("./" + sourcePath + "/" + list[i].level);
        }
    }
}
/**
 * 对图片进行分片
 * @constructor
 */
DeepZoom.prototype.CorpImages = function () {

    var list = this.computeLevels(this.width, this.height, this.tileSize);
    for (var item in list) {
        var level = list[item].level;
        if (list[item].columns == 1 && list[item].rows == 1) {//行列为1的，直接copy到目标目录，不再拆分
            this.CpImages(list[item].level);
            continue;
        }
        var levelSource = this.sourcePath + "/" + level + ".jpeg";
        var sourceImg = images(levelSource);
        for (var j = 0; j < list[item].columns; j++) {//循环裁剪出所有的图片
            for (var k = 0; k < list[item].rows; k++) {
                var rows = k;
                var columns = j;
                var position = this.getPosition(rows, columns, this.overLap, this.tileSize, list[item].columns, list[item].rows);

                console.log("make level Images..", level, sourceImg, position[0], position[1], position[2], position[3]);
                var targetImages = images(sourceImg, position[0], position[1], position[2], position[3]);
                targetImages.save(this.sourcePath + "/" + level + "/" + j + "_" + k + ".jpg", {
                    quality: 100
                });
            }
        }
    }
}
/**
 * 当level 小于一定的量时候，图基本都只有一行一列 ，就是一张缩略图，所以可以直接copy到目标地址
 * @param level
 * @constructor
 */
DeepZoom.prototype.CpImages = function (level) {
    var sourcePath = this.sourcePath + "/" + level + ".jpeg";
    var targetPath = this.sourcePath + "/" + level + "/" + "0_0" + ".jpg";
    var images = fs.readFileSync(sourcePath);
    fs.writeFileSync(targetPath, images);
}
/**
 * 最顶级的实际上为原图，复制一张原图到指定位置
 * @param level
 * @constructor
 */
DeepZoom.prototype.CopySourceImage = function (level) {
    var sourcePath = this.Url;
    var targetPath = this.sourcePath + "/" + level + ".jpeg";
    var images = fs.readFileSync(sourcePath);
    fs.writeFileSync(targetPath, images);
}
/**
 * 获取需要裁剪的坐标的 x y point 和 x y的增量长度
 * @param rows
 * @param column
 * @param overLap
 * @param tileSize
 * @param totalColumns
 * @param totalRows
 * @returns {*[]}
 */
DeepZoom.prototype.getPosition = function (rows, column, overLap, tileSize, totalColumns, totalRows) {
    var xStart = 0;
    var xEnd = 0;
    var yStart = 0;
    var yEnd = 0;

    xStart = column * tileSize;
    yStart = rows * tileSize;


    if (rows == 0 && rows < totalRows - 1) {
        yStart = 0;
        yEnd = tileSize + overLap;
    }
    if (rows > 0 && rows < totalRows - 1) {
        yStart = rows * tileSize - overLap;
        yEnd = tileSize + 2;
    }
    if (rows == 0 && rows == totalRows - 1) {
        yStart = 0;
        yEnd = tileSize;
    }
    if (rows > 0 && rows == totalRows - 1) {
        yStart = rows * tileSize - overLap;
        yEnd = tileSize + overLap;
    }

    if (column == 0 && column < totalColumns - 1) {
        xStart = 0;
        xEnd = tileSize + overLap;
    }
    if (column > 0 && column < totalColumns - 1) {
        xStart = column * tileSize - overLap;
        xEnd = tileSize + 2;
    }
    if (column == 0 && column == totalColumns - 1) {
        xStart = 0;
        xEnd = tileSize;
    }
    if (column > 0 && column == totalColumns - 1) {
        xStart = column * tileSize - overLap;
        xEnd = tileSize + overLap;
    }


    return [xStart, yStart, xEnd, yEnd];
}
/**
 * 根据列表生成缩略图
 * @constructor
 */
DeepZoom.prototype.MakeThumbImages = function (callback) {
    var list = this.computeLevels(this.width, this.height, this.tileSize);
    async.mapLimit(list, 1, this.DumpImages, function (err, results) {
        callback();
    });
}
/**
 * 逐个生成缩略图
 * @param data
 * @param callback
 * @returns {boolean}
 * @constructor
 */
DeepZoom.prototype.DumpImages = function (data, callback) {
    if (data.width == data.sourceWidth && data.height == data.sourceHeight) {
        callback(null)
        return true;
    }
    var width = data.sourceWidth
    var height = data.sourceHeight;
    var toWidth = data.width;
    var toHeight = data.height;
    var newWidth = newHeight = 0;
    if (width != 0 && height != 0 && toWidth != 0 && toHeight != 0) {
        var xscale = width / toWidth;
        var yscale = height / toHeight;

        if (yscale > xscale) {
            newWidth = Math.round(width * (1 / yscale));
            newHeight = Math.round(height * (1 / yscale));
        }
        else {
            newWidth = Math.round(width * (1 / xscale));
            newHeight = Math.round(height * (1 / xscale));
        }
        data.source.size(newWidth, newHeight).save(data.sourcePath + "/" + data.level + '.jpeg');
        callback(null);
        return true;
    }
    callback(null);
    return false;
}
/**
 * 获取图片需要缩放多少次，且每一层切分多少块
 * @param width
 * @param height
 * @param tileSize
 * @returns {Array}
 */
DeepZoom.prototype.computeLevels = function (width, height, tileSize) {
    var thumbImages = new Array();//相片的数组
    var maxLevel = this.getMaximumLevel(width, height)
    var columns = 0;
    var rows = 0;
    for (var level = maxLevel; level >= 0; level--) {
        // compute number of rows & columns
        columns = Math.ceil(width / tileSize);
        rows = Math.ceil(height / tileSize);
        thumbImages.push({
            width: width,
            height: height,
            columns: columns,
            rows: rows,
            sourceWidth: this.width,
            sourceHeight: this.height,
            source: this.sourceImage,
            level: level,
            sourcePath: this.sourcePath
        })
        // compute dimensions of next level
        width = Math.ceil(width / 2)
        height = Math.ceil(height / 2)
    }
    return thumbImages;
}
exports.DeepZoom = DeepZoom;