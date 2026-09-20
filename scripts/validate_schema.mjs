/** The small JSON Schema subset used by the checked-in world scene schema.
 * No network refs or executable extensions. Fail on unsupported schema keywords.
 */
export function validateSchema(value,schema,root=schema,at='$'){
 if(schema.$ref){const target=schema.$ref.split('/').slice(1).reduce((s,k)=>s?.[k],root);if(!target)throw Error('Unresolved schema reference');return validateSchema(value,target,root,at);}
 const fail=message=>{throw Error(`${at}: ${message}`);};
 if(schema.const!==undefined&&value!==schema.const)fail('constant mismatch');
 if(schema.type){const type=Array.isArray(value)?'array':value===null?'null':typeof value;if(type!==schema.type)fail(`expected ${schema.type}`);}
 if(schema.type==='number'&&!Number.isFinite(value))fail('non-finite number');
 if(schema.pattern&&!new RegExp(schema.pattern).test(value))fail('pattern mismatch');
 if(Array.isArray(value)){
  if(schema.minItems!==undefined&&value.length<schema.minItems)fail('too few items');
  if(schema.maxItems!==undefined&&value.length>schema.maxItems)fail('too many items');
  if(schema.items)value.forEach((v,i)=>validateSchema(v,schema.items,root,`${at}[${i}]`));
 }else if(value&&typeof value==='object'){
  for(const key of schema.required??[])if(!(key in value))fail('missing '+key);
  for(const [key,v]of Object.entries(value)){if(schema.properties?.[key])validateSchema(v,schema.properties[key],root,at+'.'+key);else if(schema.additionalProperties===false)fail('unexpected '+key);}
 }
 return true;
}
