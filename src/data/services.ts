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

  /* --- Data / analytics (agentic data engineering) --------------------- */
  glue: {
    id: 'glue',
    name: 'AWS Glue',
    category: 'data',
    oneLiner:
      'Serverless Spark ETL with a managed job runtime — the execution engine for generated Bronze/Silver/Gold transformation scripts.',
    whenToUse:
      'Run the PySpark that moves data between medallion zones without managing a cluster, and let an agent generate the job scripts.',
  },
  glue_data_quality: {
    id: 'glue_data_quality',
    name: 'AWS Glue Data Quality',
    category: 'data',
    oneLiner:
      'Rule-based data quality built on the open DQDL rule language, run as part of a Glue job or on a catalog table.',
    whenToUse:
      'Gate promotion between zones on measurable rules (completeness, uniqueness, ranges) instead of trusting the pipeline blindly.',
  },
  glue_data_catalog: {
    id: 'glue_data_catalog',
    name: 'AWS Glue Data Catalog',
    category: 'data',
    oneLiner:
      'The central technical metadata store — databases, tables and schemas that Athena, Glue and Lake Formation all read from.',
    whenToUse:
      'Register generated tables so they are queryable and governable the moment the pipeline deploys.',
  },
  athena: {
    id: 'athena',
    name: 'Amazon Athena',
    category: 'data',
    oneLiner:
      'Serverless SQL over data in S3 and Iceberg tables, billed per query scanned.',
    whenToUse:
      'Verify a freshly-deployed table actually returns rows, and give analysts a query surface with no cluster to run.',
  },
  lake_formation: {
    id: 'lake_formation',
    name: 'AWS Lake Formation',
    category: 'data',
    oneLiner:
      'Fine-grained lake permissions — column, row and cell level — driven by LF-Tags rather than per-table grants.',
    whenToUse:
      'Enforce that PII columns are readable only by a privileged role, using tag-based access control that scales past hand-written grants.',
    verifyAgainstDocs: true,
  },
  mwaa: {
    id: 'mwaa',
    name: 'Amazon MWAA',
    category: 'data',
    oneLiner:
      'Managed Apache Airflow — runs the scheduled DAG that sequences ingestion, transformation and quality gates.',
    whenToUse:
      'Schedule and retry a multi-step daily pipeline where each task depends on the previous one passing its quality gate.',
  },
  s3_tables: {
    id: 's3_tables',
    name: 'Amazon S3 Tables',
    category: 'data',
    oneLiner:
      'S3 storage purpose-built for Apache Iceberg tables, with managed compaction and snapshot maintenance.',
    whenToUse:
      'Store medallion zones as ACID Iceberg tables with schema evolution and time travel, without running your own compaction.',
    verifyAgainstDocs: true,
  },
  kms: {
    id: 'kms',
    name: 'AWS KMS',
    category: 'security',
    oneLiner:
      'Managed encryption keys with rotation and grant-based access, used to scope encryption per medallion zone.',
    whenToUse:
      'Encrypt a regulated zone under its own customer-managed key so access to raw and masked data can be separated.',
  },
  cloudtrail: {
    id: 'cloudtrail',
    name: 'AWS CloudTrail',
    category: 'observability',
    oneLiner:
      'API-level audit log of who called what, across every AWS service in the account.',
    whenToUse:
      'Evidence a regulator will accept that permission grants and table creations happened when and how you claim.',
  },
  verified_permissions: {
    id: 'verified_permissions',
    name: 'Amazon Verified Permissions',
    category: 'security',
    oneLiner:
      'Managed authorization service that evaluates Cedar policies outside application code.',
    whenToUse:
      'Enforce hard agent boundaries — such as "sub-agents may not call AWS APIs" — at a policy layer the agent cannot talk its way past.',
    verifyAgainstDocs: true,
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
