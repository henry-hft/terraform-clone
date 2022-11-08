output "ip" {
  value = "${hetzner_instance.server.public_net.ipv4.ip}"
}

output "type" {
  value = "${hetzner_instance.server.server_type.description}"
}

output "name" {
  value = "Hallo"
}

output "maschineType" {
  value = var.machineType
}


output "created" {
  value = "${hetzner_instance.server.created}"
}