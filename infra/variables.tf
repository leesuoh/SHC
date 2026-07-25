variable "tenancy_ocid" {
  default = "ocid1.tenancy.oc1..aaaaaaaa3ixhl5qmltatvzwhu2dmsm4cmxqcs3ecvq7vzkbqmobyzzdplipa"
}

variable "user_ocid" {
  default = "ocid1.user.oc1..aaaaaaaah75lgs2cwtcpjephcgmwauyg3pn26v722xdow6qtt4vvjkkwtm6a"
}

variable "fingerprint" {
  default = "15:ab:8f:5c:11:9b:cd:e5:26:3a:99:f2:a0:eb:18:de"
}

variable "private_key_path" {
  default = "~/.oci/oci_api_key.pem"
}

variable "region" {
  default = "ap-chuncheon-1"
}

variable "ssh_public_key_path" {
  default = "~/.ssh/id_rsa.pub"
}

# Ubuntu 22.04 ARM (ap-chuncheon-1) — Always Free 호환
variable "ubuntu_image_ocid" {
  default = "ocid1.image.oc1.ap-chuncheon-1.aaaaaaaauvxjy5tclxvl5nz34arovhumdt37bctdqf23sjuqrlr24vuthkvq"
}
