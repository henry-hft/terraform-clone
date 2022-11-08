var config = require('./config.json');
const hcl = require("hcl2-parser");
const fs = require("fs"); // provider Datei, SSH-Keys Datei
const prompt = require("prompt-sync")({
	sigint: true
});
require('./helper');

var args = process.env;

console.info(args);
var usedProvider = "";

var limit = 0; // Limit = 10    instead: compare, if no change -> error

var myArray = {}
var variables = [];
var defaultValues = {}
var descriptions = {}
var dataTypes = {}


var providerName = "";
var finalArray = [];
var allVariables = {};
var output = {};

function checkFileArgument(args) {
	if (args["var-file"] !== undefined) {
		if (args["var-file"] !== true) {
			console.log(args["var-file"]);
			var parts = args["var-file"].split("."); // endung und name getrennt machen
			var result = parts[parts.length - 1];
			if (result == "tfvars") {
				if (fs.existsSync(args["var-file"])) {
					console.log("exists:", args["var-file"]);
					return args["var-file"];
				} else {
					console.error("Does not exsist: ", args["var-file"]);
				}
			} else {
				console.error("Invalid file type");
			}
		} else {
			console.error("Missing value for var-file");
		}
	} else { // tfconfig file is missing
		return false;
	}
}


var hclSchema = fs.readFileSync("main.tf");
stringSchema = hcl.parseToString(hclSchema)   // Parse into a JSON string
console.log(stringSchema);
stringArray = JSON.parse(stringSchema[0]);
//console.log(stringArray);

checkSchemeVariables(stringArray);
checkSchemeProviders(stringArray);

const configFileName = checkFileArgument(args)
if (configFileName !== false) {
	const configFile = fs.readFileSync(configFileName, "utf-8");
	checkConfig(configFile);
	matchConfig(configFile, stringArray);
} else {
	var newConfig = userInput(stringArray);
	checkConfig(newConfig);
	matchConfig(newConfig, stringArray);
}


function userInput(scheme) {
	console.log(defaultValues);
	var newConfig = "";
	for (var attributename in scheme.variable) { // itteriert alle variablen über main.tf
		const type = scheme.variable[attributename][0].type;
		var typeParsed = type.substring(
			type.indexOf("${") + 2,
			type.lastIndexOf("}")
		);

		if (defaultValues[attributename] !== undefined) {
			console.info("var." + attributename + " (Data Type: " + typeParsed + ", default value: " + defaultValues[attributename] + ")");
		} else {
			console.info("var." + attributename + " (Data Type: " + typeParsed + ")");
		}

		if (descriptions[attributename] !== undefined) {
			console.info("Description: " + descriptions[attributename]);
		}

		//  var value = prompt("Enter a value: ");	 

		while (true) {
			var value = prompt("Enter a value: ");

			if (defaultValues[attributename] !== undefined && value == "") {
				if (dataTypes[attributename] == "string") {
					value = "\"" + defaultValues[attributename] + "\"";
				} else {
					value = defaultValues[attributename];
				}
				console.info("Using default value: " + defaultValues[attributename]);
				break;
			} else if (value != "") {
				if (dataTypes[attributename] == "number") {
					value = parseFloat(value);
					if (isNaN(value)) {
						console.warn("Invalid data type");
						continue;
					} else {
						break;
					}
				} else if (dataTypes[attributename] == "bool") {
					value = value.match("(true|false)"); // is boolean
					if (!value) {
						console.warn("Invalid data type");
						continue;
					} else {
						value = value[1];
						break;
					}
				} else {
					value = "\"" + value + "\"";
					break;
				}

			} else {
				console.warn("This attribute is required");
			}
			//console.log("Invalid data type");
		}

		newConfig += attributename + "=" + value + "\n";
		console.log("");
	}
	console.log(newConfig);
	// rl.close();
	return newConfig;
}

// config file lesen und die Werte prüfen
function checkConfig(config) {
	config = config.replace(/\n{2,}/g, '\n'); // remove empty lines
	config.split(/\r?\n/).forEach(line => { // read config file line by line

		var newLine = line.split(/\s/).join(''); // remove white spaces
		//var newLine = newLine.replaceAll('"', '');

		var splitted = newLine.split("=");

		if (splitted[1] !== undefined) {

			var checkString = String(splitted[1]).match("^\"(.*)\"$"); // is string

			if (checkString) {
				console.log(splitted[1] + " is a string");
				myArray[splitted[0]] = ["string", checkString[1]];
				allVariables["var." + splitted[0]] = checkString[1];
			} else {

				var checkNumber = String(splitted[1]).match("[+-]?([0-9]*[.])?[0-9]+"); // is number
				if (checkNumber) {
					console.log(splitted[1] + " is a number");
					myArray[splitted[0]] = ["number", checkNumber[0]];
					allVariables["var." + splitted[0]] = checkNumber[0];
				} else {

					var checkBool = String(splitted[1]).match("(true|false)"); // is boolean
					if (checkBool) {
						console.log(splitted[1] + " is a boolean");
						myArray[splitted[0]] = ["bool", checkBool[1]];
						allVariables["var." + splitted[0]] = checkBool[1];
					} else {
						console.error(splitted[1] + ": Invalid data type");

					}
				}
			}
		}
	});

}

console.log("=========");
console.log(myArray);
console.log("=========");

// Check if Config file is valid
function checkSchemeVariables(scheme) {
	console.log("Call function checkScheme\n----------------");
	for (var attributename in scheme) {
		console.log(attributename);
		if (attributename != "variable" && attributename != "provider") {
			console.error("Invalid schema");

		}
	}


	for (var attributename in scheme.variable) {
		const type = scheme.variable[attributename][0].type;
		if (type === undefined) {
			console.error("Invalid schema. Only type is allowed");

		}
		var typeParsed = type.substring(
			type.indexOf("${") + 2,
			type.lastIndexOf("}")
		);

		console.log("---");
		console.log(typeParsed);

		if (typeParsed == "string" ||
			typeParsed == "number" ||
			typeParsed == "bool"
		) {
			variables.push(attributename);

			const defaultValue = scheme.variable[attributename][0].default;
			if (defaultValue !== undefined) {
				if (typeof defaultValue === typeParsed) {
					defaultValues[attributename] = defaultValue;
				} else {
					console.error("Invalid data type for default value");
					// 
				}

			}

			const description = scheme.variable[attributename][0].description;
			if (description !== undefined) {
				descriptions[attributename] = description;
			}

			dataTypes[attributename] = typeParsed;

		} else {
			console.error("Invalid data type 123")

		}

		//console.log(attributename+": "+stringArray[attributename]);
	}
}


// Check if Config file is valid
function matchConfig(config, scheme) {
	for (var attributename in scheme.variable) {
		if (myArray[attributename] !== undefined) { // check ob alle variablen in der main.tf definiert worden und config.tfvars existiert
			const type = scheme.variable[attributename][0].type;
			var typeParsed = type.substring(
				type.indexOf("${") + 2,
				type.lastIndexOf("}")
			);
			if (myArray[attributename][0] == typeParsed) {
				console.log(`${attributename} is ${typeParsed}: ${myArray[attributename]}`)
			} else {
				console.error(`${attributename} wrong data type`);

			}
			console.log("---");
		} else {
			console.error(`Missing ${attributename} variable in .tfvars file`);

		}

		//console.log(attributename+": "+stringArray[attributename]);
	}
}


function checkSchemeProviders(scheme) {
	var requiredVariables = ["credentials", "region"];
	if (scheme.provider !== undefined) {
		console.info("Provider name: ");
		var providerJson = Object.keys(scheme.provider)
		providerName = providerJson[0];
		if ((config.provider).includes(providerName)) { // Prüft Provider in der Datei existiert oder nicht
			for (attributename in scheme.provider[providerName][0]) {
				console.info("OK");
				console.log(attributename);
				var value = scheme.provider[providerName][0][attributename]
				console.warn(value);
				var parameterIndex = requiredVariables.indexOf(attributename);
				if (parameterIndex !== -1) {
					if (typeof value === "string") {
						requiredVariables.splice(parameterIndex, 1);
						allVariables["provider." + attributename] = value;
					} else {
						console.error("Invalid data type for one or more parameters in provider.");
					}
				} else {
					console.error("Unknown parameter in provider");
				}
			}
			if (requiredVariables.length == 0) {
				allVariables["provider.provider"] = providerName.toLowerCase();
			} else {
				console.error("Missing parameter(s) in provider.");
			}
		} else {
			console.error("Unsupported provider");
		}
	} else {
		console.error("Provider is missing in main.tf");
	}
}

// Read the file appserver.tf
var resourceSchema = fs.readFileSync("appserver.tf");
stringResourceSchema = hcl.parseToString(resourceSchema)
console.log(stringResourceSchema);
stringResourceArray = JSON.parse(stringResourceSchema[0]);
console.log(stringResourceArray);


parseResource(stringResourceArray)
function parseResource(scheme) {


	console.log("Call function parseResource\n----------------");
	for (var attributename in scheme) {
		console.log(attributename);
		if (attributename != "resource" && attributename != "output") {
			console.error("Invalid scheme");

		}
	}


	for (var attributename in scheme.resource) {
		console.log(attributename);
		var isInstance = attributename.match("(.*)_instance$");
		if (isInstance) {
			if ((config.provider).includes(isInstance[1])) {
				console.log("Valid provider");
				usedProvider = isInstance[1].toLowerCase(); // -----------------------------------------------------------------------------------
				console.log(scheme.resource[attributename]);

				for (var attributename2 in scheme.resource[attributename]) {
					for (var attributename3 in scheme.resource[attributename][attributename2][0]) {
						var attributeValue = scheme.resource[attributename][attributename2][0][attributename3];
						if (typeof attributeValue === 'object') {
							console.log(attributename3);
							if (attributename3 == "boot_disk" && attributeValue[0]?.initialize_params !== undefined) {
								if (attributeValue[0].initialize_params[0]?.image !== undefined) {
									var imageValue = attributeValue[0].initialize_params[0].image
									allVariables["boot_disk.initialize_params.image"] = imageValue;
								}
							}

							if (attributename3 == "metadata" && attributeValue?.["ssh-keys"] !== undefined) {
								var SSHKeyValue = attributeValue["ssh-keys"]
								allVariables["metadata.ssh-keys"] = SSHKeyValue;
							}

							if (attributename3 == "metadata" && attributeValue?.["cloud-init"] !== undefined) {
								var CloudInitValue = attributeValue["cloud-init"]
								allVariables["metadata.cloud-init"] = CloudInitValue;
							}

							if (attributename3 == "tags" && Array.isArray(attributeValue)) {
								var tagsValue = attributeValue
								allVariables["tags"] = tagsValue;
							}

						} else {
							allVariables[attributename3] = attributeValue;
						}

						console.log("------------\n\n\n Attribute name: " + attributename3 + "\n" + scheme.resource[attributename][attributename2][0][attributename3]);
					}

					console.log(allVariables);
				}

			} else {
				console.error("Invalid provider");

			}

		}
		//console.log(isInstance);
		//if(attributename
		//const type = scheme.variable[attributename][0].type;
	}
	resolveVariables();
	checkVariables();
	console.log(allVariables);
	checkIndex(); 
	console.log(finalArray);
}

function checkMandatoryVariables(input) {
	var requiredVariables = ["provider.provider", "provider.credentials", "provider.region", "machine_type", "count", "metadata.ssh-keys"];
	for (attributename in input) {
		var parameterIndex = requiredVariables.indexOf(attributename);
		if (parameterIndex !== -1) {
			requiredVariables.splice(parameterIndex, 1);
		}
	}
	if (requiredVariables.length > 0) {
		console.error("Missing variables(s) in the .tf file.");
	}
}

// cheken, ob sshKey in der Datei oder String
function resolveVariables() {
	limit = limit + 1;
	var finish = true;
	for (const key in allVariables) {
		var isArray = false;
		if (Array.isArray(allVariables[key])) { // move to other function
			allVariables[key] = allVariables[key].join("|");
			isArray = true;
		}
		if (typeof allVariables[key] === "boolean") {
			continue;
		}
		if (typeof allVariables[key] == "number") {
			continue;
		}
		var containsVariable = [...allVariables[key].matchAll(/[$]{([^}]+)}/g)];
		console.log(containsVariable);
		if (containsVariable.length == 0) {
			console.log("No unresolved variables found");
		} else {
			console.log("Unresolved variables found");
			finish = false;
		}
		for (var i = 0; i < containsVariable.length; i++) {
			var arrValue = containsVariable[i][1];
			var isFile = arrValue.match("^file[(](.*)[)]$"); // prüf ob die Variablen in der Datei ist oder ganz String ist
			if (isFile) {
				if (allVariables[isFile[1]] !== undefined) { // Prüf ob die Datei exist oder nicht

					var fileContents;
					try {
						fileContents = fs.readFileSync(allVariables[isFile[1]], 'utf8')
						allVariables[key] = allVariables[key].replace(containsVariable[i][0], fileContents);
						console.log(fileContents);
					} catch (err) {
						console.error("File not found");

					}

					console.log("exists");
				} else {
					console.error("Undefined variable");
				}
			} else {
				if (allVariables[arrValue] !== undefined) {
					console.log("exists");
					allVariables[key] = allVariables[key].replace(containsVariable[i][0], allVariables[arrValue]);
				} else {
					if (arrValue == "count.index") {
						console.log("Have an index")
						console.log(arrValue);
						allVariables[key] = allVariables[key].replace(containsVariable[i][0], "<>");
					} else {
						console.log(arrValue);
						console.error("Undefined variable");
					}
				}

			}
			console.log(isFile);
		}
		if (isArray) {
			allVariables[key] = allVariables[key].split("|");
		}
	}

	if (limit > 10) {
		console.error("Could not resolve all variables");

	}
	if (!finish) {
		resolveVariables();
	}
}

function checkIndex() {
	containsIndex = [];
	for (const key in allVariables) {
		if (String(allVariables[key]).includes("<>")) {
			containsIndex.push(key);
		}
	}

	for (i = 1; i <= allVariables["count"]; i++) {
		var allVariablesNew = {}
		Object.assign(allVariablesNew, allVariables);
		for (var x = 0; x < containsIndex.length; x++) {
			allVariablesNew[containsIndex[x]] = allVariablesNew[containsIndex[x]].replace("<>", i);
		}
		finalArray.push(allVariablesNew);
	}
}

function checkVariables() {
	console.log(allVariables);
	if (allVariables["name"] !== undefined) {
		if (typeof allVariables["name"] !== 'string') {
			console.error("Variable 'name' has to be a string.");

		}
	} else {
		console.error("Variable 'name' does not exists.");

	}

	if (allVariables["machine_type"] !== undefined) {
		if (typeof allVariables["machine_type"] !== 'string') {
			console.error("Variable 'machine_type' has to be a string.");

		}
	} else {
		console.error("Variable 'machine_type' does not exists.");

	}

	/*if(allVariables["zone"] !== undefined) {
		if(typeof allVariables["zone"] !== 'string'){
			console.error("Variable 'zone' has to be a string.");
			 
		}
	} else {
		console.error("Variable 'zone' does not exists.");
		 
	}*/

	if (allVariables["boot_disk.initialize_params.image"] !== undefined) {
		allVariables["boot_disk.initialize_params.image"] = parseInt(allVariables["boot_disk.initialize_params.image"]);
		if (isNaN(allVariables["boot_disk.initialize_params.image"])) {
			console.error("Variable 'boot_disk.initialize_params.image' has to be an integer.");

		}
	} else {
		console.error("Variable 'boot_disk.initialize_params.image' does not exists.");

	}

	if (allVariables["metadata.ssh-keys"] !== undefined) {
		if (typeof allVariables["metadata.ssh-keys"] !== 'object') {
			console.error("Variable 'metadata.ssh-keys' has to be an Array.");

		}
	} else {
		console.error("Variable 'metadata.ssh-keys' does not exists.");

	}

	if (allVariables["metadata.cloud-init"] !== undefined) {
		if (typeof allVariables["metadata.cloud-init"] !== 'string') {
			console.error("Variable 'metadata.cloud-init' has to be a string.");

		}
	} else { // default value
		allVariables["metadata.cloud-init"] = "";
	}

	if (allVariables["count"] !== undefined) {
		allVariables["count"] = parseInt(allVariables["count"]);
		if (!isNaN(allVariables["count"])) {
			if (allVariables["count"] < 1) {
				console.error("Variable 'count' has to be greater than 0.");

			}
		} else {
			console.error("Variable 'count' has to be an integer.");

		}
	} else { // default value
		allVariables["count"] = 1;
	}


	if (allVariables["backups"] !== undefined) {
		if (typeof allVariables["backups"] !== 'boolean') {
			console.error("Variable 'backups' has to be a boolean.");

		}
	} else { // default value
		allVariables["backups"] = false;
	}

}

checkMandatoryVariables(allVariables);

var outputScheme = fs.readFileSync("output.tf");
stringOutputScheme = hcl.parseToString(outputScheme)
console.log(stringOutputScheme);
var outputArray = JSON.parse(stringOutputScheme[0]);
console.log(outputArray);
parseOutput(outputArray);


function parseOutput(scheme) {
	console.warn("------------------------------ Output -------------------------");
	var fileContents;
	var outputSchemeArray = [];
	if (scheme.output !== undefined) {
		try {
			outputContent = fs.readFileSync("providers/" + usedProvider + ".json", 'utf8');
			outputSchemeArray = JSON.parse(outputContent);
		} catch (err) {
			console.error("Scheme file not found");
		}
		for (var attributename in scheme.output) {
			//console.log(attributename);
			if (scheme.output[attributename][0].value !== undefined) {
				var value = scheme.output[attributename][0].value;
				var containsVariable = String(value).match("[$]{(.*)}$");
				if (containsVariable) {
					var checkGlobalVariable = containsVariable[1].match("^var.(.*)");
					//console.log(checkGlobalVariable);
					if (checkGlobalVariable) {
						if (finalArray[0][checkGlobalVariable[0]] !== undefined) {
							console.log(attributename + " = " + finalArray[0][containsVariable[1]]);
							output[attributename] = finalArray[0][containsVariable[1]];
						} else {
							console.error("Undefined global variable");
						}
					} else {
						var checkProviderInstance = containsVariable[1].match("^" + usedProvider + "_instance.(.*)");
						if (checkProviderInstance) {
							//console.log(checkProviderInstance);
							//console.log(outputSchemeArray[checkProviderInstance[1]]);
							var outputKeys = checkProviderInstance[1].split(".");
							//console.log(outputKeys);
							//	console.log(outputSchemeArray[outputKeys[0]]);
							//	console.log("dsdadsasdasdsdas");
							var outputSchemeArrayCopy = { ...outputSchemeArray };
							for (var i = 0; i < outputKeys.length; i++) {
								if (outputSchemeArrayCopy[outputKeys[i]] !== undefined) {
									if (i == outputKeys.length - 1) {
										if (typeof outputSchemeArrayCopy[outputKeys[i]] === 'object') {
											console.error("Output can not be an array");
										}
									} else {
										outputSchemeArrayCopy = outputSchemeArrayCopy[outputKeys[i]];
									}
								} else {
									console.error("Parameter not found in output");
								}
							}
							console.log(attributename + " = " + "<>" + checkProviderInstance[1]);
							output[attributename] = "<>" + checkProviderInstance[1];

							//	console.log(outputSchemeArray.server.server_type.description);
						} else {
							console.error("Undefined output variable");
						}
					}
				} else {
					console.log(attributename + " = " + value);
					output[attributename] = value;
				}
			} else {
				console.error("Value parameter is missing");
			}
		}
	} else {
		console.error("Unkown variable in output.tf")
	}
	console.warn("------------------------------ Output end -------------------------");
}
saveJSON(finalArray, output)

function saveJSON(content, output) {
	content.unshift(output)
	console.log("-------------------------------------------")
	console.log(content)
	console.log("-------------------------------------------")
	fs.writeFile('tmp.json', JSON.stringify(content), err => {
		if (!err) {
			console.info("Finish");
		} else {
			console.error("Could not create temporary JSON file");
		}
	});
}