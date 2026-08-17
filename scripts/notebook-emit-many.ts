import { writeFileSync } from 'fs'
import { notebookToJson } from '../src/notebooks/compile'
import { definitionFromId } from '../src/data/notebookTemplates'
const ids = ['guardrailed_secure_rag__healthcare','multi_kb_agentic_rag__legal','memory_augmented_rag__hr_policy','naive_rag__developer_docs','agentic_rag__customer_support']
for (const id of ids) { writeFileSync(`/tmp/${id}.ipynb`, notebookToJson(definitionFromId(id)!)); console.log('wrote', id) }
