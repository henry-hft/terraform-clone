
variable "project_name" {
  type = string
}

variable "region" {
  type = string
  default = "eu-central"
}

variable "ssh_pub_key_path" {
  type = string
}

variable "count" {
  type = number
}

variable "machineType" {
  type = string
}

provider "hetzner" {
 credentials = var.api_credentials
 region      = var.region
}
