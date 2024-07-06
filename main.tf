terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}

provider "aws" {
  region  = "us-east-1"
}



resource "aws_vpc" "main" {
  cidr_block = "172.31.0.0/16"
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
}

resource "aws_route_table" "main" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
}

resource "aws_subnet" "subnet_0ed5ba8fc4e488bd0" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "172.31.32.0/20"
  availability_zone = "us-east-1d"
  map_public_ip_on_launch = true
}

resource "aws_subnet" "subnet_09d9c8ed0104ae05b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "172.31.64.0/20"
  availability_zone = "us-east-1f"
  map_public_ip_on_launch = true
}

resource "aws_subnet" "subnet_0a520ea38621163f5" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "172.31.48.0/20"
  availability_zone = "us-east-1e"
  map_public_ip_on_launch = true
}

resource "aws_subnet" "subnet_0bb0555f941aa4866" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "172.31.80.0/20"
  availability_zone = "us-east-1b"
  map_public_ip_on_launch = true
}

resource "aws_subnet" "subnet_0613c0dbffe6d32ea" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "172.31.0.0/20"
  availability_zone = "us-east-1a"
  map_public_ip_on_launch = true
}

resource "aws_subnet" "subnet_06f209555c521da07" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "172.31.16.0/20"
  availability_zone = "us-east-1c"
  map_public_ip_on_launch = true
}

resource "aws_route_table_association" "subnet_0ed5ba8fc4e488bd0" {
  subnet_id      = "subnet-0ed5ba8fc4e488bd0"
  route_table_id = aws_route_table.main.id
}

resource "aws_route_table_association" "subnet_09d9c8ed0104ae05b" {
  subnet_id      = "subnet-09d9c8ed0104ae05b"
  route_table_id = aws_route_table.main.id
}

resource "aws_route_table_association" "subnet_0a520ea38621163f5" {
  subnet_id      = "subnet-0a520ea38621163f5"
  route_table_id = aws_route_table.main.id
}

resource "aws_route_table_association" "subnet_0bb0555f941aa4866" {
  subnet_id      = "subnet-0bb0555f941aa4866"
  route_table_id = aws_route_table.main.id
}

resource "aws_route_table_association" "subnet_0613c0dbffe6d32ea" {
  subnet_id      = "subnet-0613c0dbffe6d32ea"
  route_table_id = aws_route_table.main.id
}

resource "aws_route_table_association" "subnet_06f209555c521da07" {
  subnet_id      = "subnet-06f209555c521da07"
  route_table_id = aws_route_table.main.id
}

resource "aws_security_group" "launch-wizard-1" {
  name        = "launch-wizard-1"
  description = "launch-wizard-1 created 2024-03-14T00:58:31.112Z"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = []
  }
}

resource "aws_network_interface" "main" {
  subnet_id       = aws_subnet.subnet_06f209555c521da07.id
  private_ips     = ["172.31.25.69"]
  security_groups = [aws_security_group.launch-wizard-1.id]
}


resource "aws_eip" "my_eip" {
  instance = aws_instance.ezero.id
  associate_with_private_ip = "172.31.25.69"
  depends_on = [ aws_internet_gateway.main ]
}


resource "aws_instance" "ezero" {
  ami           = "ami-07d9b9ddc6cd8dd30"
  instance_type = "t2.micro"
  key_name = "ezero"
  availability_zone = "us-east-1c"
  
  user_data = "${file("./scripts/deployment.sh")}"
}

resource "aws_api_gateway_rest_api" "my_api" {
  name        = "flightuc"
}

resource "aws_api_gateway_resource" "flights" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_rest_api.my_api.root_resource_id
  path_part   = "flights" 
}

resource "aws_api_gateway_method" "flights_GET" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.flights.id
  http_method   = "GET"
  authorization = "NONE"
}

# /{identifier}
resource "aws_api_gateway_resource" "identifier" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_resource.flights.id
  path_part   = "{identifier}"
}

resource "aws_api_gateway_method" "identifier_GET" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.identifier.id
  http_method   = "GET"
  authorization = "NONE"
  request_parameters = {
    "method.request.path.identifier" = true
  }
}

# /login
resource "aws_api_gateway_resource" "login" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_rest_api.my_api.root_resource_id
  path_part   = "login"
}

resource "aws_api_gateway_method" "login_OPTIONS" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.login.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "login_POST" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.login.id
  http_method   = "POST"
  authorization = "NONE"
}

# /recommendations
resource "aws_api_gateway_resource" "recommendations" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_rest_api.my_api.root_resource_id
  path_part   = "recommendations"
}


resource "aws_api_gateway_method" "recommendations_GET" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.recommendations.id
  http_method   = "GET"
  authorization = "NONE"
}

# /request
resource "aws_api_gateway_resource" "request" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_rest_api.my_api.root_resource_id
  path_part   = "request"
}

resource "aws_api_gateway_method" "request_OPTIONS" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.request.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "request_POST" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.request.id
  http_method   = "POST"
  authorization = "NONE"
  request_parameters = {
    "method.request.header.Authorization" = false
    "method.request.header.authorization" = false
  }
}

# /requests
resource "aws_api_gateway_resource" "requests" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_rest_api.my_api.root_resource_id
  path_part   = "requests"
}

resource "aws_api_gateway_method" "requests_GET" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.requests.id
  http_method   = "GET"
  authorization = "NONE"
  request_parameters   = {
    "method.request.header.Authorization" = false 
    "method.request.header.authorization" = false 
  }
}

resource "aws_api_gateway_method" "requests_OPTIONS" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.requests.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# /signup
resource "aws_api_gateway_resource" "signup" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_rest_api.my_api.root_resource_id
  path_part   = "signup"
}

resource "aws_api_gateway_method" "signup_OPTIONS" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.signup.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "signup_POST" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.signup.id
  http_method   = "POST"
  authorization = "NONE"
}

# /transaction
resource "aws_api_gateway_resource" "transaction" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_rest_api.my_api.root_resource_id
  path_part   = "transaction"
}

resource "aws_api_gateway_method" "transaction_OPTIONS" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.transaction.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# /{token}
resource "aws_api_gateway_resource" "token" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_resource.transaction.id
  path_part   = "{token}"
}

resource "aws_api_gateway_method" "token_GET" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.token.id
  http_method   = "GET"
  authorization = "NONE"
  request_parameters   = {
    "method.request.path.token" = true
  }
}

resource "aws_api_gateway_method" "token_OPTIONS" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.token.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

output "elastic_ip" {
  value = aws_eip.my_eip.public_ip
}

output "ssh_command" {
  value = "ssh -i ${aws_instance.ezero.key_name}.pem ubuntu@${aws_eip.my_eip.public_ip}"
}
