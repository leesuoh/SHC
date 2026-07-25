terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 6.0"
    }
  }
}

provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}

# ── VCN ──
resource "oci_core_vcn" "shc_vcn" {
  compartment_id = var.tenancy_ocid
  cidr_block     = "10.0.0.0/16"
  display_name   = "shc-vcn"
  dns_label      = "shcvcn"
}

# ── Internet Gateway ──
resource "oci_core_internet_gateway" "shc_igw" {
  compartment_id = var.tenancy_ocid
  vcn_id         = oci_core_vcn.shc_vcn.id
  display_name   = "shc-igw"
  enabled        = true
}

# ── Route Table ──
resource "oci_core_route_table" "shc_rt" {
  compartment_id = var.tenancy_ocid
  vcn_id         = oci_core_vcn.shc_vcn.id
  display_name   = "shc-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    network_entity_id = oci_core_internet_gateway.shc_igw.id
  }
}

# ── Security List (방화벽) ──
resource "oci_core_security_list" "shc_sl" {
  compartment_id = var.tenancy_ocid
  vcn_id         = oci_core_vcn.shc_vcn.id
  display_name   = "shc-security-list"

  # SSH
  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 22
      max = 22
    }
  }
  # HTTP
  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 80
      max = 80
    }
  }
  # HTTPS
  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
  }
  # 모든 아웃바운드 허용
  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
  }
}

# ── Subnet ──
resource "oci_core_subnet" "shc_subnet" {
  compartment_id    = var.tenancy_ocid
  vcn_id            = oci_core_vcn.shc_vcn.id
  cidr_block        = "10.0.1.0/24"
  display_name      = "shc-subnet"
  dns_label         = "shcsubnet"
  route_table_id    = oci_core_route_table.shc_rt.id
  security_list_ids = [oci_core_security_list.shc_sl.id]
}

# ── VM Instance (A1.Flex ARM — Always Free) ──
resource "oci_core_instance" "shc_server" {
  compartment_id      = var.tenancy_ocid
  availability_domain = "NwId:AP-CHUNCHEON-1-AD-1"
  display_name        = "shc-server"
  shape               = "VM.Standard.A1.Flex"

  shape_config {
    ocpus         = 4
    memory_in_gbs = 24
  }

  source_details {
    source_type = "image"
    source_id   = var.ubuntu_image_ocid
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.shc_subnet.id
    assign_public_ip = true
    display_name     = "shc-vnic"
  }

  metadata = {
    ssh_authorized_keys = file(var.ssh_public_key_path)
  }
}
