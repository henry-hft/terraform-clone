const fs = require("fs");
const axios = require('axios');
const uniqid = require('uniqid');
var request = require('sync-request');
const sleep = require('atomic-sleep')
const fingerprint = require('ssh-fingerprint');
require('./helper');

var json = [];
var provider = "";
var sshKeys1 = [];

readJSONFile("tmp.json");
checkProvider(json);
//createSSHKeys(json);
console.log("sshKeys"); 
//sshKeys1 = sshKeysVultr(json);
console.log(sshKeys1);
var test = [];
console.log(test);
createSSHKeys(json)
//createServer(json)

function readJSONFile(filename){
	try {
		fileContents = fs.readFileSync(filename, 'utf8')
		json = JSON.parse(fileContents);
	} catch (err) {
		console.error("Tmp file not found");
	}
}

function checkProvider(json){
	provider = json[1]["provider.provider"];
}




function createServer(json){
	if(provider == "hetzner"){
		createServerHetzner(json);
	} else if(provider == "vultr"){
		createServerVultr(json);
	} else {
		console.error("Unknown provider");
	}
}


function createSSHKeys(json){
	if(provider == "hetzner"){
		sshKeysHetzner(json);
	} else if(provider == "vultr"){
		sshKeysVultr(json);
	} else {
		console.error("Unknown provider");
	}
}


function sshKeysHetzner(json){
	var sshKeys = [];
	if(json[1]["metadata.ssh-keys"].length > 0){
	
	var sshkeyJson = {};
		
		var res1 = request('GET', 'https://api.hetzner.cloud/v1/ssh_keys', {
			headers: {
				'Content-Type': 'application/json',
			'Authorization': 'Bearer ' +  json[1]["provider.credentials"]
			},
		});
		
		var response = JSON.parse(res1.getBody('utf8'));
	
			if(response){
				//console.log(response);
				if(response.ssh_keys !== undefined){
					console.log("data.ssh");
					sshkeyJson = response.ssh_keys;
					console.log(sshkeyJson);

				} else {
					console.error(response.data.error.message);
				}
			} 
				console.log("after");
	
	console.log(json[1]["metadata.ssh-keys"].length)

	for(var i = 0; i < json[1]["metadata.ssh-keys"].length; i++){
		var currentSSHKey = (json[1]["metadata.ssh-keys"][i]).replace("\n", "");
		console.log("------------------------");
		var continueLoop = false;
		console.log(sshkeyJson)
		for(var x = 0; x < sshkeyJson.length; x++){
			var sshKeyFingerprint = fingerprint(currentSSHKey, algorithm = 'md5');
			//console.log(sshkeyJson[x]["ssh_key"]);
			if(sshkeyJson[x]["fingerprint"] == sshKeyFingerprint){
				sshKeys.push(sshkeyJson[x]["name"]);
				//sshKeys.push("asdasd");
				console.info(sshkeyJson[x]["name"]);
				continueLoop = true;
				break;
			}
		}
		
		if(continueLoop === true){
			continue;
		}
		
		
		var res = request('POST', 'https://api.hetzner.cloud/v1/ssh_keys', {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' +  json[1]["provider.credentials"]
			},
			json: {
				"name": uniqid(),
				"public_key": currentSSHKey
			}
		});
		var responseSSH = JSON.parse(res.getBody('utf8'));

			console.log(responseSSH);
			
				if(responseSSH){
				//responseSSH =  JSON.parse(responseSSH);
				if(responseSSH.ssh_key !== undefined){
					var sshkeyString = responseSSH.ssh_key.id;
					sshKeys.push(sshkeyString);
					console.log(sshkeyString);
			console.info("---------------");
			console.info("---------------");
			console.info("---------------");
			console.info("---------------");
					//console.log(sshkeyJson);
				} else {
					console.error(responseSSH.error.message);
				}
			}
	}
			
			console.log(sshKeys);

		createServerHetzner(json, sshKeys)
	} else {
		console.error("SSH Key is missing");
	}
	
}

function sshKeysVultr(json){
	var sshKeys = [];
	if(json[1]["metadata.ssh-keys"].length > 0){
	
	var sshkeyJson = {};
		
		var res1 = request('GET', 'https://api.vultr.com/v2/ssh-keys', {
			headers: {
				'Content-Type': 'application/json',
			'Authorization': 'Bearer ' +  json[1]["provider.credentials"]
			},
		});
		
		var response = JSON.parse(res1.getBody('utf8'));
	
			if(response){
				//console.log(response);
				if(response.ssh_keys !== undefined){
					console.log("data.ssh");
					sshkeyJson = response.ssh_keys;
					console.log(sshkeyJson);

				} else {
					console.error(response.data.error.message);
				}
			} 
				console.log("after");
	
	console.log(json[1]["metadata.ssh-keys"].length)

	for(var i = 0; i < json[1]["metadata.ssh-keys"].length; i++){
		var currentSSHKey = (json[1]["metadata.ssh-keys"][i]).replace("\n", "");
		console.log("------------------------");
		var continueLoop = false;
		console.log(sshkeyJson)
		for(var x = 0; x < sshkeyJson.length; x++){
			//var sshKeyFingerprint = fingerprint(, algorithm = 'md5');
			console.log(sshkeyJson[x]["ssh_key"]);
			if(sshkeyJson[x]["ssh_key"] == currentSSHKey){
				sshKeys.push(sshkeyJson[x]["id"]);
				//sshKeys.push("asdasd");
				console.info(sshkeyJson[x]["id"]);
				continueLoop = true;
				break;
			}
		}
		
		if(continueLoop === true){
			continue;
		}
		
		
		var res = request('POST', 'https://api.vultr.com/v2/ssh-keys', {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' +  json[1]["provider.credentials"]
			},
			json: {
				"name": uniqid(),
				"ssh_key": currentSSHKey
			}
		});
		var responseSSH = JSON.parse(res.getBody('utf8'));

			console.log(responseSSH);
			
				if(responseSSH){
				//responseSSH =  JSON.parse(responseSSH);
				if(responseSSH.ssh_key !== undefined){
					var sshkeyString = responseSSH.ssh_key.id;
					sshKeys.push(sshkeyString);
					console.log(sshkeyString);
			console.info("---------------");
			console.info("---------------");
			console.info("---------------");
			console.info("---------------");
					//console.log(sshkeyJson);
				} else {
					console.error(responseSSH.error.message);
				}
			}
	}
			
			console.log(sshKeys);

		createServerVultr(json, sshKeys)
	} else {
		console.error("SSH Key is missing");
	}
	
}

function createServerVultr(json, sshKeys){
	//console.log(sshKeys);
	//console.log(sshKeys);
	//console.log(sshKeys);
	for(var i = 1; i < json.length; i++){
		var response = "";
		if(json[i]["backups"] === true){
			var backups = "enabled";
		} else {
			var backups = "disabled";
		}
		var base64encoded = Buffer.from(json[i]["metadata.cloud-init"]).toString('base64');
		
		var data = JSON.stringify({
			"region": json[i]["provider.region"],
			"plan": json[i]["machine_type"],
			"label": json[i]["name"],
			"os_id": json[i]["boot_disk.initialize_params.image"],
			"user_data": base64encoded,
			"backups": backups,
			"sshkey_id": sshKeys,
			"hostname": json[i]["name"]
		});
		
		console.log(data);
		
		const headers = {
			'Content-Type': 'application/json',
			'Content-Length': data.length,
			'Authorization': 'Bearer ' +  json[i]["provider.credentials"]
		};
		
		axios.post('https://api.vultr.com/v2/instances', data, {
			headers: headers
		})
		.then(function (response) {
			console.log(response);
			// check if IPv4 Address is assigned
			var instanceID = response.data.instance.id;
			while(true){
				console.info("Creating server...");
				sleep(5000);
				var res2 = request('GET', 'https://api.vultr.com/v2/instances/' + instanceID, {
					headers: {
						'Content-Type': 'application/json',
						'Authorization': 'Bearer ' +  json[1]["provider.credentials"]
					},
				});
		
				var response2 = JSON.parse(res2.getBody('utf8'));
				console.log(response2["instance"]["main_ip"]);
				if(response2["instance"]["main_ip"] != "0.0.0.0"){
					getOutput(json[0], response2);
					break;
				}
			}
	
			
		})
		.catch(function (error) {
			console.error(error);
		});
	}
}

function createServerHetzner(json, sshKeys){
	console.log(sshKeys);
	console.log(sshKeys);
	console.log(sshKeys);
	for(var i = 1; i < json.length; i++){
		var response = "";
		if(json[i]["backups"] === true){
			var backups = "enabled";
		} else {
			var backups = "disabled";
		}
		
		var data = JSON.stringify({
			"location": json[i]["provider.region"],
			"server_type": json[i]["machine_type"],
			"image": json[i]["boot_disk.initialize_params.image"],
			"user_data": json[i]["metadata.cloud-init"],
			"backups": backups,
			"ssh_keys": sshKeys,
			"name": json[i]["name"]
		});
		console.log(data)
		
		const headers = {
			'Content-Type': 'application/json',
			'Content-Length': data.length,
			'Authorization': 'Bearer ' +  json[i]["provider.credentials"]
		};
		
		axios.post('https://api.hetzner.cloud/v1/servers', data, {
			headers: headers
		})
		.then(function (response) {
			//console.log(response.data);
			//console.log("Server " + i + ": " + serverName);
			//console.log("---------------")
			console.info("Creating server...");
			getOutput(json[0], response.data);
		})
		.catch(function (error) {
			console.log(error);
			console.error(error.response.data);
		});
		
	}
}


function getOutput(output, response){
	
	if(provider == "hetzner"){
		console.log("Server: " + response.server.name);
	} else if (provider == "vultr"){
		console.log("Server: " + response.instance.hostname);
	}
	console.log("------------------------");
	
	//console.log(response);
	for(attributename in output){
	//	var newResponse = JSON.parse(response);
	var newResponse = response;
		
	//	console.log(newResponse);
		var value = output[attributename];
		//console.log(value);
		var providerResponse = value.match("^<>(.*)"); 
		//console.log(providerResponse);
		if(providerResponse){
			var outputKeys = (providerResponse[1]).split(".");
			//var json = 
			//console.log(newResponse["server"])
			for(var i = 0; i < outputKeys.length; i++){
				//console.log(outputKeys[i]);
				if(newResponse[outputKeys[i]] !== undefined){
					if(i == outputKeys.length - 1){
						if(typeof newResponse[outputKeys[i]] !== 'object'){
							console.log(attributename + " = " + newResponse[outputKeys[i]]);
						} else {
							console.error("Output can not be an array");
						}
					} else {
						newResponse = newResponse[outputKeys[i]];
					}
				} else {
					console.log(attributename + " = undefined");
					break;
				}
				
			}
			//console.log(newResponse);
		} else {
			console.log(attributename + " = " + output[attributename]);
 		}
		//console.log(providerResponse);
		//var split = providerResponse[1].split(".");
		//console.log(split);
	}
	console.log("");
}
