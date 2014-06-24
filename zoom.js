/**
 * Created by magicpig on 6/18/14.
 */
var deepZoom = require("./DeepZoom.js").DeepZoom;

console.time("process");
var dz = new deepZoom("4.jpg");
dz.setOption("quality", 10);
console.log(dz.Make("source4"));
console.timeEnd("process");