import { supabase } from "./lib/supabase";
import type { CanvasElement, DocumentTemplate, DynamicField } from "./types";

export type CloudTemplate={id:string;name:string;description:string|null;page_width:number;page_height:number;unit:string;orientation:string;settings:Record<string,unknown>;updated_at:string};

export async function getCloudSession(){
  if(!supabase)return null;
  const {data}=await supabase.auth.getSession();
  return data.session;
}

export async function signInWithEmail(email:string){
  if(!supabase)throw new Error("Supabase n'est pas configuré.");
  return supabase.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin}});
}

export async function signOutCloud(){if(supabase)await supabase.auth.signOut()}

export async function loadCloudTemplates(){
  if(!supabase)return [];
  const {data,error}=await supabase.from("document_templates").select("id,name,description,page_width,page_height,unit,orientation,settings,updated_at").order("updated_at",{ascending:false});
  if(error)throw error;
  return (data??[]) as CloudTemplate[];
}

export async function loadCloudFields(){
  if(!supabase)return [];
  const {data,error}=await supabase.from("document_field_definitions").select("id,field_key,label,data_type,options").order("created_at");
  if(error)throw error;
  return data??[];
}

export async function saveCloudTemplate(template:DocumentTemplate){
  if(!supabase)throw new Error("Supabase n'est pas configuré.");
  const payload:any={name:template.name,description:template.description,page_width:template.width,page_height:template.height,unit:"mm",orientation:template.width>template.height?"landscape":"portrait",settings:{apitah:{width:template.width,height:template.height}},is_active:true,updated_at:new Date().toISOString()};
  if(template.cloudId)payload.id=template.cloudId;
  const {data,error}=await supabase.from("document_templates").upsert(payload,{onConflict:"id"}).select("id").single();
  if(error)throw error;
  const templateId=data.id;
  const del=await supabase.from("document_template_elements").delete().eq("template_id",templateId);
  if(del.error)throw del.error;
  const elements=template.elements.map((el:CanvasElement)=>({template_id:templateId,element_type:el.type,name:el.label,content:el.label,x:el.x,y:el.y,width:el.width,height:el.height,rotation:el.rotation??0,z_index:el.zIndex??0,locked:false,visible:true,style:{fontSize:el.fontSize,fontWeight:el.fontWeight,textAlign:el.align,color:el.color??"#273143",backgroundColor:el.backgroundColor??"transparent",borderColor:el.borderColor??"transparent",borderWidth:el.borderWidth??0,borderRadius:el.borderRadius??0,opacity:el.opacity??1},properties:{fieldKey:el.fieldKey,assetUrl:el.assetUrl,lockAspect:el.lockAspect}});
  const ins=elements.length?await supabase.from("document_template_elements").insert(elements):{error:null};
  if(ins.error)throw ins.error;
  return templateId as string;
}

export async function saveCloudFields(fields:DynamicField[]){
  if(!supabase)throw new Error("Supabase n'est pas configuré.");
  for(const field of fields){
    const {data:existing,error:findError}=await supabase.from("document_field_definitions").select("id").eq("field_key",field.key).maybeSingle();
    if(findError)throw findError;
    const payload:any={label:field.label,field_key:field.key,data_type:field.type,options:field.options?{values:field.options}:{},is_custom:true};
    if(existing?.id)payload.id=existing.id;
    const {error}=await supabase.from("document_field_definitions").upsert(payload,{onConflict:"id"});
    if(error)throw error;
  }
}
