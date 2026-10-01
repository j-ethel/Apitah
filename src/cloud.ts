import { supabase } from "./lib/supabase";
import type { CanvasElement, DocumentTemplate, DynamicField } from "./types";

export type CloudTemplate={id:string;name:string;description:string|null;page_width:number;page_height:number;unit:string;orientation:string;settings:Record<string,unknown>;updated_at:string};

function dataUrlToBlob(dataUrl:string){
  const [meta,data]=dataUrl.split(",");
  const mime=meta.match(/data:([^;]+)/)?.[1]??"application/octet-stream";
  const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));
  return new Blob([bytes],{type:mime});
}

export async function getCloudSession(){if(!supabase)return null;const {data}=await supabase.auth.getSession();return data.session}
export async function signInWithEmail(email:string){if(!supabase)throw new Error("Supabase n'est pas configuré.");return supabase.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin}})}
export async function signOutCloud(){if(supabase)await supabase.auth.signOut()}

export async function uploadAssetDataUrl(name:string,dataUrl:string){
  if(!supabase)throw new Error("Supabase n'est pas configuré.");
  const session=await getCloudSession();if(!session?.user)throw new Error("Connectez-vous à Supabase.");
  const blob=dataUrlToBlob(dataUrl);
  const ext=(blob.type.split("/")[1]||"bin").replace("jpeg","jpg");
  const path=session.user.id+"/"+crypto.randomUUID()+"."+ext;
  const up=await supabase.storage.from("apitah-assets").upload(path,blob,{contentType:blob.type,upsert:false});
  if(up.error)throw up.error;
  const meta=await supabase.from("document_assets").insert({name,asset_type:"image",storage_path:path,metadata:{mime_type:blob.type,size:blob.size}}).select("id").single();
  if(meta.error)throw meta.error;
  return {path,assetId:meta.data.id};
}
export async function signedAssetUrl(path:string){
  if(!supabase)return null;
  const {data,error}=await supabase.storage.from("apitah-assets").createSignedUrl(path,60*60);
  if(error)throw error;return data.signedUrl;
}

export async function loadCloudTemplates(){
  if(!supabase)return [];
  const {data,error}=await supabase.from("document_templates").select("id,name,description,page_width,page_height,unit,orientation,settings,updated_at,document_template_elements(*)").order("updated_at",{ascending:false});
  if(error)throw error;return (data??[]) as CloudTemplate[];
}
export async function loadCloudFields(){if(!supabase)return [];const {data,error}=await supabase.from("document_field_definitions").select("id,field_key,label,data_type,options").order("created_at");if(error)throw error;return data??[]}

async function cloudElement(el:CanvasElement){
  let assetUrl=el.assetUrl;
  if(assetUrl?.startsWith("data:image/")){const uploaded=await uploadAssetDataUrl(el.label||"image",assetUrl);assetUrl=uploaded.path}
  return {template_id:"",element_type:el.type,name:el.label,content:el.label,x:el.x,y:el.y,width:el.width,height:el.height,rotation:el.rotation??0,z_index:el.zIndex??0,locked:false,visible:true,style:{fontSize:el.fontSize,fontWeight:el.fontWeight,textAlign:el.align,color:el.color??"#273143",backgroundColor:el.backgroundColor??"transparent",borderColor:el.borderColor??"transparent",borderWidth:el.borderWidth??0,borderRadius:el.borderRadius??0,opacity:el.opacity??1},properties:{fieldKey:el.fieldKey,assetPath:assetUrl?.startsWith("http")?undefined:assetUrl,lockAspect:el.lockAspect}};
}
export async function saveCloudTemplate(template:DocumentTemplate){
  if(!supabase)throw new Error("Supabase n'est pas configuré.");
  const session=await getCloudSession();if(!session?.user)throw new Error("Connectez-vous à Supabase.");
  const payload:any={name:template.name,description:template.description,page_width:template.width,page_height:template.height,unit:"mm",orientation:template.width>template.height?"landscape":"portrait",settings:{apitah:{width:template.width,height:template.height}},is_active:true,updated_at:new Date().toISOString()};
  if(template.cloudId)payload.id=template.cloudId;
  const {data,error}=await supabase.from("document_templates").upsert(payload,{onConflict:"id"}).select("id").single();if(error)throw error;
  const templateId=data.id;
  const del=await supabase.from("document_template_elements").delete().eq("template_id",templateId);if(del.error)throw del.error;
  const elements=[];for(const el of template.elements){const item=await cloudElement(el);elements.push({...item,template_id:templateId})}
  if(elements.length){const ins=await supabase.from("document_template_elements").insert(elements);if(ins.error)throw ins.error}
  return templateId as string;
}
export async function saveCloudFields(fields:DynamicField[]){
  if(!supabase)throw new Error("Supabase n'est pas configuré.");const session=await getCloudSession();if(!session?.user)throw new Error("Connectez-vous à Supabase.");
  for(const field of fields){const {data:existing,error:findError}=await supabase.from("document_field_definitions").select("id").eq("field_key",field.key).maybeSingle();if(findError)throw findError;const payload:any={label:field.label,field_key:field.key,data_type:field.type,options:field.options?{values:field.options}:{},is_custom:true};if(existing?.id)payload.id=existing.id;const {error}=await supabase.from("document_field_definitions").upsert(payload,{onConflict:"id"});if(error)throw error}
}
export async function saveCloudImport(filename:string,rows:Record<string,unknown>[],mapping:Record<string,unknown>={}){
  if(!supabase)throw new Error("Supabase n'est pas configuré.");const session=await getCloudSession();if(!session?.user)throw new Error("Connectez-vous à Supabase.");
  const ins=await supabase.from("document_imports").insert({filename,status:"completed",total_rows:rows.length,valid_rows:rows.length,invalid_rows:0,error_report:[],mapping,completed_at:new Date().toISOString()}).select("id").single();if(ins.error)throw ins.error;
  const items=rows.map((row,i)=>({import_id:ins.data.id,row_number:i+2,raw_data:row,normalized_data:row,status:"valid",errors:[]}));
  for(let i=0;i<items.length;i+=500){const part=items.slice(i,i+500);const q=await supabase.from("document_import_rows").insert(part);if(q.error)throw q.error}
  return ins.data.id as string;
}
export async function loadLatestCloudImport(){
  if(!supabase)return null;const {data,error}=await supabase.from("document_imports").select("id,filename,total_rows,created_at,document_import_rows(row_number,normalized_data,status)").order("created_at",{ascending:false}).limit(1).maybeSingle();if(error)throw error;if(!data)return null;
  return {id:data.id,filename:data.filename??"",rows:(data.document_import_rows??[]).filter((x:any)=>x.status==="valid").sort((a:any,b:any)=>a.row_number-b.row_number).map((x:any)=>x.normalized_data as Record<string,unknown>)};
}
export async function resolveAssetPaths(elements:CanvasElement[]){
  const out=elements.map(x=>({...x}));
  for(const el of out){const path=(el as any).assetPath??(el as any).assetUrl;if(path&&typeof path==="string"&&!path.startsWith("http")&&!path.startsWith("data:"))el.assetUrl=await signedAssetUrl(path)??undefined}
  return out;
}
export type CloudJob={id:string;name:string;code:string;description:string|null;document_type_id:string|null;template_id:string|null;active:boolean;settings:Record<string,unknown>;created_at:string;updated_at:string};

export async function loadCloudJobs(){
  if(!supabase)return [];
  const {data,error}=await supabase.from("document_jobs").select("id,name,code,description,document_type_id,template_id,active,settings,created_at,updated_at").order("updated_at",{ascending:false});
  if(error)throw error; return (data??[]) as CloudJob[];
}

export async function saveCloudJob(job:{id?:string;name:string;code:string;description?:string;document_type_id?:string|null;template_id?:string|null;active?:boolean;settings?:Record<string,unknown>}){
  if(!supabase)throw new Error("Supabase n'est pas configuré.");
  const session=await getCloudSession();if(!session?.user)throw new Error("Connectez-vous à Supabase.");
  const payload:any={name:job.name.trim(),code:job.code.trim().toUpperCase(),description:job.description??null,document_type_id:job.document_type_id??null,template_id:job.template_id??null,active:job.active??true,settings:job.settings??{}};
  if(job.id)payload.id=job.id;
  const {data,error}=await supabase.from("document_jobs").upsert(payload,{onConflict:"id"}).select("id,name,code,description,document_type_id,template_id,active,settings,created_at,updated_at").single();
  if(error)throw error;return data as CloudJob;
}

export async function loadCloudDocumentTypes(){
  if(!supabase)return [];
  const {data,error}=await supabase.from("document_types").select("id,name,code,description,active").eq("active",true).order("name");
  if(error)throw error;return data??[];
}

export async function deleteCloudJob(id:string){
  if(!supabase)throw new Error("Supabase n'est pas configuré.");
  const {error}=await supabase.from("document_jobs").delete().eq("id",id);if(error)throw error;
}
