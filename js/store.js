import {supabase,isSupabaseConfigured} from './supabase.js';
import {USE_DEMO_FALLBACK} from './config.js';
const KEY='bigbear_alpha_db';
let cache=null, mode='demo';
async function demoSeed(){const saved=localStorage.getItem(KEY);if(saved)return JSON.parse(saved);const res=await fetch('data/demo.json');const d=await res.json();localStorage.setItem(KEY,JSON.stringify(d));return d}
async function query(sb,table,select='*'){const {data,error}=await sb.from(table).select(select);if(error)throw error;return data||[]}
async function loadRemote(){
 const sb=await supabase(); if(!sb) throw new Error('Supabase not configured');
 const [branches,customers,inventory,partners]=await Promise.all([
  query(sb,'branches'), query(sb,'customers'), query(sb,'inventory_items'), query(sb,'partners')
 ]);
 let tasks=[]; try{tasks=await query(sb,'tasks')}catch(_){tasks=[]}
 return {
  branches:branches.map(x=>({id:x.code||x.id,name:x.name,type:x.branch_type||x.type||'company'})),
  customers:customers.map(x=>({id:x.id,phone:x.phone,name:x.name||x.full_name||'-',tag:x.tag||''})),
  inventory:inventory.map(x=>({uid:x.id||x.uid,brand:x.brand||'',name:x.product_name||x.name||'-',color:x.color||'-',identifier:x.imei||x.serial_no||x.barcode||x.identifier||'-',tracking:x.imei?'IMEI':x.serial_no?'Serial':x.barcode?'Barcode':x.tracking||'ID',branch:x.branch_name||x.branch||'-',supplier:x.supplier_name||x.supplier||'-',cost:Number(x.unit_cost||x.cost||0),receiveType:x.receive_type||x.receiveType||'-',status:x.status||'-',qty:Number(x.qty||1)})),
  partners:partners.map(x=>({id:x.id,code:x.code,name:x.name,type:x.partner_type||x.type||'-',sales:Number(x.sales||0),due:Number(x.due||0),products:x.products||[]})), tasks
 };
}
export async function seed(){if(cache)return cache;if(isSupabaseConfigured()){try{cache=await loadRemote();mode='supabase';return cache}catch(e){console.error('Supabase load failed',e);if(!USE_DEMO_FALLBACK)throw e}}cache=await demoSeed();mode='demo';return cache}
await seed();
export function store(){return cache}
export function dataMode(){return mode}
export function save(){if(mode==='demo')localStorage.setItem(KEY,JSON.stringify(cache))}
export async function reload(){cache=null;return seed()}
export async function resetStore(){localStorage.removeItem(KEY);cache=null;return seed()}
export async function findCustomer(phone){if(mode==='supabase'){const sb=await supabase();const {data,error}=await sb.from('customers').select('*').eq('phone',phone).maybeSingle();if(error)throw error;return data?{...data,name:data.name||data.full_name}:null}return cache.customers.find(x=>x.phone===phone)||null}
export async function createSale(payload){if(mode!=='supabase')return {id:'DEMO-'+Date.now(),demo:true};const sb=await supabase();const {data,error}=await sb.from('sales').insert(payload).select().single();if(error)throw error;return data}
export async function audit(action,entity_type,entity_id=null,after_data=null){if(mode!=='supabase')return;const sb=await supabase();await sb.from('audit_logs').insert({action,entity_type,entity_id,after_data})}
