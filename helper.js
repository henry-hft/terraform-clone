const dataError = {
 icon: '✘',

 redBg: "\x1b[41m",
 redFg: "\x1b[31m",
 whiteFg: "\x1b[37m",

 reset: "\x1b[0m",
 reverse: "\x1b[7m"
};
console.old_error = console.error;
console.error = function() {
 console.old_error(dataError.redBg + dataError.whiteFg, dataError.icon, dataError.reset, dataError.redFg, ...arguments, dataError.reset);
 process.exit(1);
};
module.exports = console.error ;


const dataWarning = {
 icon: '\u26A0',

 yellowBg: "\x1b[43m",
 yellowFg: "\x1b[33m",
 whiteFg: "\x1b[37m",

 reset: "\x1b[0m",
 reverse: "\x1b[7m"
};
console.old_warn =  console.warn ;

console.warn = function() {
 console.old_warn(dataWarning.yellowBg + dataWarning.whiteFg, dataWarning.icon, dataWarning.reset, dataWarning.yellowFg, ...arguments, dataWarning.reset);
};
module.exports = console.warn ;

const dataInfo = {
 icon: '\u2139',

 blueBg: "\x1b[44m",
 blueFg: "\x1b[36m",
 whiteFg: "\x1b[37m",

 reset: "\x1b[0m",
 reverse: "\x1b[7m"
};
console.old_info =  console.info ;
console.info = function() {
 console.old_info(dataInfo.blueBg + dataInfo.whiteFg, dataInfo.icon, dataInfo.reset, dataInfo.blueFg, ...arguments, dataInfo.reset);
};
module.exports = console.info ;