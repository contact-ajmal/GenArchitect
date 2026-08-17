import { writeFileSync } from 'fs'
import { notebookToJson } from '../src/notebooks/compile'
import type { NotebookDefinition, UseCaseFlavor } from '../src/notebooks/model'
import { compositionFromPattern } from '../src/compose/composition'
import { ARCHITECTURES } from '../src/data/architectures'
const flavor: UseCaseFlavor = { id:'meridian', name:'Internal knowledge assistant', industry:'Financial services', description:'demo', corpusDescription:'synthetic policy docs in S3', sampleQuestions:['What is the expense limit?','How long do we retain EU records?'], domainConsiderations:['access control'], systemPromptHint:'cite sources', bucketExample:'s3://meridian-corpus', adaptNote:'Point at your corpus.' }
const id='managed_kb_rag' as const
const arch=ARCHITECTURES[id]
const def: NotebookDefinition = { id:`${id}__meridian`, title:`${arch.name} — Meridian`, description:'end-to-end', patternId:id, useCaseFlavorId:'meridian', difficulty:arch.difficulty, estimatedTime:'~30 min', awsServiceIds:arch.awsServiceIds, prerequisites:['AWS account','Python 3.10+'], tags:[id], composition:compositionFromPattern(id), flavor }
writeFileSync('/tmp/demo.ipynb', notebookToJson(def))
console.log('wrote /tmp/demo.ipynb')
