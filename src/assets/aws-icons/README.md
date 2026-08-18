# AWS Architecture Icons

This folder holds the **official AWS Architecture Icons** as local SVG assets.
They are **not committed** to this repo (they're AWS's assets — download them
yourself). When present, `AwsServiceIcon` renders them automatically across the
app (home service grid, every diagram node). When absent, a clean generic
fallback glyph is shown — we never draw or approximate an AWS logo.

## How to add them

1. Download the official **AWS Architecture Icons** package (SVG) from:
   **https://aws.amazon.com/architecture/icons/**
   (Toolkit → "AWS Architecture Icons" ZIP.)

2. From the package, copy the matching service SVG into this folder and **rename
   it to the file id below** (lowercase, `.svg`). The app looks up icons by these
   exact file names:

   | File id (`<id>.svg`)              | Official icon to use                          |
   |----------------------------------|-----------------------------------------------|
   | `agentcore-runtime.svg`          | Amazon Bedrock AgentCore (Runtime)            |
   | `agentcore-memory.svg`           | Amazon Bedrock AgentCore (Memory)             |
   | `agentcore-gateway.svg`          | Amazon Bedrock AgentCore (Gateway)            |
   | `agentcore-identity.svg`         | Amazon Bedrock AgentCore (Identity)           |
   | `agentcore-browser.svg`          | Amazon Bedrock AgentCore (Browser)            |
   | `agentcore-code-interpreter.svg` | Amazon Bedrock AgentCore (Code Interpreter)   |
   | `agentcore-observability.svg`    | Amazon Bedrock AgentCore (Observability)      |
   | `agentcore-evaluations.svg`      | Amazon Bedrock AgentCore (Evaluations)        |
   | `agentcore-policy.svg`           | Amazon Bedrock AgentCore (Policy)             |
   | `amazon-bedrock.svg`             | Amazon Bedrock                                |
   | `bedrock-knowledge-bases.svg`    | Amazon Bedrock — Knowledge Bases resource     |
   | `bedrock-guardrails.svg`         | Amazon Bedrock — Guardrails resource          |
   | `opensearch-service.svg`         | Amazon OpenSearch Service                     |
   | `aurora.svg`                     | Amazon Aurora                                 |
   | `neptune.svg`                    | Amazon Neptune                                |
   | `simple-storage-service.svg`     | Amazon Simple Storage Service (S3)            |
   | `iam.svg`                        | AWS Identity and Access Management (IAM)      |
   | `cognito.svg`                    | Amazon Cognito                                |
   | `cloudwatch.svg`                 | Amazon CloudWatch                             |
   | `lambda.svg`                     | AWS Lambda                                    |
   | `mcp.svg`                        | (Model Context Protocol — not an AWS service; optional generic) |
   | `strands.svg`                    | (Strands Agents SDK — open source, not an AWS service; optional) |

   > AgentCore sub-capabilities may share one icon in the official set. If so,
   > copy the single AgentCore icon to each `agentcore-*.svg` id above.

3. That's it — no code changes. Vite picks up the new SVGs and every
   `AwsServiceIcon` starts rendering the official artwork.

## Usage / trademark

The AWS Architecture Icons are provided by AWS under their own terms of use —
review and comply with them. Use them to depict services factually. Do **not**
add the AWS corporate logo, "Powered by AWS", or any partner badge. GenArchitect
is an independent educational tool and is not affiliated with, endorsed by, or
sponsored by Amazon Web Services.
