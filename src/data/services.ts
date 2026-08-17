import type { AwsService, AwsServiceId } from '../types'

/**
 * The building-block registry. Every AwsServiceId maps to exactly one record.
 * One-liners are written to be accurate to AWS reality (Amazon Bedrock,
 * Bedrock AgentCore, and the Strands Agents SDK) as of early 2026. Records with
 * `verifyAgainstDocs: true` cover fast-moving APIs/SDKs — screens should show a
 * "verify against current AWS docs" callout beside them.
 */
export const AWS_SERVICES: Record<AwsServiceId, AwsService> = {
  /* --- Amazon Bedrock AgentCore --------------------------------------- */
  agentcore_runtime: {
    id: 'agentcore_runtime',
    name: 'AgentCore Runtime',
    category: 'agentcore',
    oneLiner:
      'Serverless, secure runtime for hosting agents and tools, with per-session isolation and support for long-running (up to hours) executions.',
    whenToUse:
      'Deploy a framework- and model-agnostic agent (Strands, LangGraph, CrewAI, custom) to production without managing servers, scaling, or session isolation yourself.',
    verifyAgainstDocs: true,
  },
  agentcore_memory: {
    id: 'agentcore_memory',
    name: 'AgentCore Memory',
    category: 'agentcore',
    oneLiner:
      'Managed agent memory: short-term working memory within a session plus long-term, cross-session memories (user facts, preferences, summaries).',
    whenToUse:
      'Give an agent continuity about the user and prior sessions. It complements RAG — it is not a store of authoritative documents and does not replace retrieval.',
    verifyAgainstDocs: true,
  },
  agentcore_gateway: {
    id: 'agentcore_gateway',
    name: 'AgentCore Gateway',
    category: 'agentcore',
    oneLiner:
      'Turns existing REST/OpenAPI APIs, AWS Lambda functions, and Bedrock Knowledge Bases into MCP-compatible agent tools, with centralized auth, routing, and observability.',
    whenToUse:
      'Expose enterprise tools and data sources to agents securely without hand-writing each integration; centralize IAM, access control, and tool discovery.',
    verifyAgainstDocs: true,
  },
  agentcore_identity: {
    id: 'agentcore_identity',
    name: 'AgentCore Identity',
    category: 'agentcore',
    oneLiner:
      'Identity and credential management for agents — inbound authorization of callers and secure, scoped outbound access to AWS and third-party services (OAuth, API keys).',
    whenToUse:
      'Let an agent act on behalf of a specific user or workload with least-privilege, auditable credentials instead of long-lived shared secrets.',
    verifyAgainstDocs: true,
  },
  agentcore_browser: {
    id: 'agentcore_browser',
    name: 'AgentCore Browser',
    category: 'agentcore',
    oneLiner:
      'A secure, managed, sandboxed cloud browser that agents can drive to navigate and interact with websites.',
    whenToUse:
      'When an agent must operate a web UI or extract data from sites that lack an API.',
    verifyAgainstDocs: true,
  },
  agentcore_code_interpreter: {
    id: 'agentcore_code_interpreter',
    name: 'AgentCore Code Interpreter',
    category: 'agentcore',
    oneLiner:
      'A secure, sandboxed environment for agents to execute code (e.g. Python) for calculation, data analysis, and file transformation.',
    whenToUse:
      'When answering requires real computation, data wrangling, or deterministic transforms rather than free-text generation.',
    verifyAgainstDocs: true,
  },
  agentcore_observability: {
    id: 'agentcore_observability',
    name: 'AgentCore Observability',
    category: 'observability',
    oneLiner:
      'Built-in tracing, metrics, and logging for agents — OpenTelemetry-compatible and integrated with Amazon CloudWatch.',
    whenToUse:
      'Debug, monitor, and audit agent behavior in production: step trajectories, tool calls, token usage, latency, and errors.',
    verifyAgainstDocs: true,
  },
  agentcore_evaluations: {
    id: 'agentcore_evaluations',
    name: 'AgentCore Evaluations',
    category: 'observability',
    oneLiner:
      'Tooling to evaluate agent quality and trajectories — measure answer accuracy, tool-use correctness, and regressions against datasets.',
    whenToUse:
      'Continuously test agents before and after changes to catch quality regressions before they reach users.',
    verifyAgainstDocs: true,
  },
  agentcore_policy: {
    id: 'agentcore_policy',
    name: 'AgentCore Policy',
    category: 'agentcore',
    oneLiner:
      'Policy controls that constrain which tools and actions an agent may use, enforcing organizational guardrails at runtime.',
    whenToUse:
      'Bound agent autonomy per role or context — allow/deny specific tools and actions so an agent cannot exceed its mandate.',
    verifyAgainstDocs: true,
  },

  /* --- Amazon Bedrock -------------------------------------------------- */
  bedrock_kb_managed: {
    id: 'bedrock_kb_managed',
    name: 'Bedrock Knowledge Bases (managed)',
    category: 'bedrock',
    oneLiner:
      'Fully managed RAG: native data connectors, automatic parsing/chunking/embedding, a managed vector store, document-level access control, and cited retrieval.',
    whenToUse:
      'Ship RAG fast with minimal ops — ingest from S3, SharePoint, Confluence, Google Drive, OneDrive, or a web crawler and get citations, ACLs, and Retrieve / RetrieveAndGenerate APIs out of the box.',
    verifyAgainstDocs: true,
  },
  bedrock_kb_customer_managed: {
    id: 'bedrock_kb_customer_managed',
    name: 'Bedrock Knowledge Bases (customer-managed vector store)',
    category: 'bedrock',
    oneLiner:
      'Bedrock Knowledge Bases pointed at a vector store you own and operate — OpenSearch Serverless, Aurora PostgreSQL/pgvector, or Neptune Analytics.',
    whenToUse:
      'When you need control over the vector store, index configuration, data residency, or cost — accepting more operational ownership than the quick-create managed store.',
    verifyAgainstDocs: true,
  },
  bedrock_foundation_models: {
    id: 'bedrock_foundation_models',
    name: 'Bedrock Foundation Models',
    category: 'bedrock',
    oneLiner:
      'Managed access to leading foundation and embedding models (Anthropic Claude, Amazon Nova/Titan, Meta Llama, Cohere, and more) through a single API.',
    whenToUse:
      'The generation and embedding engines behind RAG and agents — choose models per task, region, latency, and cost.',
  },
  bedrock_guardrails: {
    id: 'bedrock_guardrails',
    name: 'Bedrock Guardrails',
    category: 'security',
    oneLiner:
      'Configurable safety controls: denied topics, content filters, word filters, sensitive-information (PII) detection/redaction, and contextual grounding checks.',
    whenToUse:
      'Enforce input/output safety and reduce ungrounded answers for enterprise and regulated workloads; apply consistently across models and agents.',
    verifyAgainstDocs: true,
  },

  /* --- Vector / graph / storage --------------------------------------- */
  opensearch_serverless: {
    id: 'opensearch_serverless',
    name: 'OpenSearch Serverless',
    category: 'vector',
    oneLiner:
      'Serverless Amazon OpenSearch with a k-NN vector engine and BM25 keyword search — no cluster to size or manage.',
    whenToUse:
      'A scalable managed vector (and hybrid keyword+vector) store for RAG, including as a backing store for Bedrock Knowledge Bases.',
  },
  aurora_pgvector: {
    id: 'aurora_pgvector',
    name: 'Aurora PostgreSQL (pgvector)',
    category: 'vector',
    oneLiner:
      'Amazon Aurora PostgreSQL with the pgvector extension for storing and querying embeddings alongside relational data.',
    whenToUse:
      'When you want vectors next to transactional data with SQL filtering and familiar Postgres operations; a supported Bedrock KB vector store.',
  },
  neptune: {
    id: 'neptune',
    name: 'Amazon Neptune',
    category: 'vector',
    oneLiner:
      'A managed graph database; Neptune Analytics adds fast graph algorithms and vector search — the backbone for GraphRAG over connected entities.',
    whenToUse:
      'When answers depend on relationships and multi-hop traversal across connected entities, not just semantic similarity.',
  },
  s3: {
    id: 's3',
    name: 'Amazon S3',
    category: 'storage',
    oneLiner:
      'Durable, scalable object storage — the canonical landing zone for source documents feeding RAG ingestion.',
    whenToUse:
      'Store raw corpora (PDFs, HTML, transcripts) as the source for Bedrock KB connectors or a custom ingestion pipeline.',
  },

  /* --- Security / observability --------------------------------------- */
  iam: {
    id: 'iam',
    name: 'AWS IAM',
    category: 'security',
    oneLiner:
      'Fine-grained identity and access management for AWS — roles, policies, and least-privilege permissions.',
    whenToUse:
      'Scope every agent, tool, and data-store access to least privilege; the backbone of secure, auditable RAG.',
  },
  cloudwatch: {
    id: 'cloudwatch',
    name: 'Amazon CloudWatch',
    category: 'observability',
    oneLiner:
      'Monitoring and observability for AWS — metrics, logs, traces, dashboards, and alarms.',
    whenToUse:
      'Collect agent traces and metrics (via AgentCore Observability), alarm on anomalies, and retain records for audit and operations.',
  },

  /* --- Agent frameworks ----------------------------------------------- */
  strands_sdk: {
    id: 'strands_sdk',
    name: 'Strands Agents SDK',
    category: 'framework',
    oneLiner:
      'An open-source, model-driven Python SDK for building agents in a few lines — define a model, a system prompt, and tools, and let the model drive the loop.',
    whenToUse:
      'Build agents quickly and idiomatically and run them anywhere, including on AgentCore Runtime.',
    verifyAgainstDocs: true,
  },
  strands_agents_tools: {
    id: 'strands_agents_tools',
    name: 'strands-agents-tools',
    category: 'framework',
    oneLiner:
      'A library of prebuilt Strands tools (retrieval, memory, HTTP, AWS access, code execution, and more) you can drop into an agent.',
    whenToUse:
      'Reuse maintained tools like `retrieve` and `memory` instead of writing integrations from scratch.',
    verifyAgainstDocs: true,
  },
  mcp: {
    id: 'mcp',
    name: 'Model Context Protocol (MCP)',
    category: 'framework',
    oneLiner:
      'An open protocol that standardizes how agents connect to tools and data sources through MCP servers.',
    whenToUse:
      'Integrate tools and data portably and framework-agnostically — e.g. consume AgentCore Gateway targets or third-party MCP servers.',
  },
}
