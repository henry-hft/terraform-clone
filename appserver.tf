resource "hetzner_instance" "appserver" {
  name         = "appserver-vm-${count.index}-${var.machineType}"
  machine_type = "cx${var.machineType}"
  count = var.count
  backups = true
  shell_file = "test.sh"

// Betribssystem definieren
  boot_disk {
    initialize_params {
      image = 45557056
    }
  }

// ssh-keys muss und cloud-init optional 
  metadata = {
    ssh-keys = [file(var.ssh_pub_key_path)],
	  cloud-init = file(shell_file)
  }
}