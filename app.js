const fork = require('child_process').fork;
const args = require('args-parser')(process.argv);

checkArguments(args);

function checkArguments(args) {
    if (args.validate !== undefined && args.apply === undefined && args.help === undefined) { // eingegebene daten(Z.B. config.tvars usw.) gültig ist, geprüft wird, danach wird ein Schemadatei erstellt tmp.js
		console.log("validate");
		//prüft config file
		if (args["var-file"] !== undefined) {
			fork('./parser.js', { env: { 'var-file': args["var-file"] } });
		} else {
			fork('./parser.js');
		}
		
    } else if (args.apply !== undefined && args.validate === undefined && args.help === undefined) { // das liest tmp.json ein und führt API Aufrufe aus 
        console.log("apply");
		fork('./provider.js');
    } else if (args.help !== undefined && args.validate === undefined && args.apply === undefined) { // console log
        console.log("help");
    } else {
        console.log("Unknown/undefinied functions");
    }
}