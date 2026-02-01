data "archive_file" "lambda_cors_proxy" {
  type        = "zip"
  source_dir  = "${path.root}/../lambda/cors-proxy"
  output_path = "${path.root}/.terraform/lambda-cors-proxy.zip"
}

resource "aws_iam_role" "lambda_cors_proxy" {
  name = "mtg-maker-cors-proxy-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "lambda_cors_proxy_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_cors_proxy.name
}

resource "aws_lambda_function" "cors_proxy" {
  filename         = data.archive_file.lambda_cors_proxy.output_path
  function_name    = "mtg-maker-cors-proxy"
  role             = aws_iam_role.lambda_cors_proxy.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_cors_proxy.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 256
  tags             = local.tags
}

resource "aws_lambda_function_url" "cors_proxy" {
  function_name      = aws_lambda_function.cors_proxy.function_name
  authorization_type = "NONE"
  cors {
    allow_credentials = false
    allow_origins     = ["*"]
    allow_methods     = ["GET"]
    allow_headers     = ["*"]
    max_age           = 86400
  }
  depends_on = [aws_lambda_function.cors_proxy]
  lifecycle {
    replace_triggered_by = [aws_lambda_function.cors_proxy]
  }
}

resource "aws_cloudwatch_log_group" "cors_proxy" {
  name              = "/aws/lambda/mtg-maker-cors-proxy"
  retention_in_days = 90
  tags              = local.tags
}

output "cors_proxy_url" {
  value       = aws_lambda_function_url.cors_proxy.function_url
  description = "URL for the CORS proxy Lambda function"
}

