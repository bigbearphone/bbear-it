import {supabase,isSupabaseConfigured} from './supabase.js';
import {USE_DEMO_FALLBACK} from './config.js';
const KEY='bigbear_alpha_db';
let cache=null, mode='demo';
async function demoSeed(){const saved=localStorage.getItem(KEY);if(saved)return JSON.parse(saved);const res=await fetch('data/demo.json');const d=await res.json();localStorage.setItem(KEY,JSON.stringify(d));return d}
async function query(sb,table,select='*'){const {data,error}=await sb.from(table).select(select);if(error)throw error;return data||[]}
async function loadRemote(){
  const sb = await supabase();
  if(!sb) throw new Error('Supabase not configured');

  const [
    branches,
    customers,
    inventory,
    partners,
    products,
    suppliers
  ] = await Promise.all([
    query(sb,'branches'),
    query(sb,'customers'),
    query(sb,'inventory_items'),
    query(sb,'partners'),
    query(sb,'products'),
    query(sb,'suppliers')
  ]);

  const productById = new Map(products.map(x => [x.id, x]));
  const branchById = new Map(branches.map(x => [x.id, x]));
  const supplierById = new Map(suppliers.map(x => [x.id, x]));

  return {
    branches: branches.map(x => ({
      id: x.code || x.id,
      name: x.name,
      type: x.branch_type || x.type || 'company'
    })),

    customers: customers.map(x => ({
      id: x.id,
      phone: x.phone,
      name: x.name || x.full_name || '-',
      tag: x.tag || ''
    })),

    inventory: inventory.map(x => {
      const p = productById.get(x.product_id) || {};
      const b = branchById.get(x.branch_id) || {};
      const s = supplierById.get(x.supplier_id) || {};

      const identifier =
        x.imei ||
        x.serial_no ||
        x.barcode ||
        x.bb_uid ||
        x.id;

      const tracking =
        x.imei ? 'IMEI' :
        x.serial_no ? 'Serial' :
        x.barcode ? 'Barcode' :
        'ID';

      return {
        uid: x.bb_uid || x.id,
        brand: p.brand || '',
        name: [p.brand, p.model, p.capacity]
          .filter(Boolean)
          .join(' ') || p.sku || '-',
        color: p.color || '-',
        identifier,
        tracking,
        branch: b.name || '-',
        supplier: s.name || '-',
        cost: Number(x.unit_cost || p.default_cost || 0),
        receiveType: x.acquisition_type || '-',
        status: x.status || '-',
        qty: 1
      };
    }),

    partners: partners.map(x => ({
      id: x.id,
      code: x.code,
      name: x.name,
      type: x.partner_type || x.type || '-',
      sales: Number(x.sales || 0),
      due: Number(x.due || 0),
      products: x.products || []
    })),

    tasks: []
  };
}
export async function seed(){if(cache)return cache;if(isSupabaseConfigured()){try{cache=await loadRemote();mode='supabase';return cache}catch(e){console.error('Supabase load failed',e);if(!USE_DEMO_FALLBACK)throw e}}cache=await demoSeed();mode='demo';return cache}

export function store(){return cache}
export function dataMode(){return mode}
export function save(){if(mode==='demo')localStorage.setItem(KEY,JSON.stringify(cache))}
export async function reload(){cache=null;return seed()}
export async function resetStore(){localStorage.removeItem(KEY);cache=null;return seed()}
export async function findCustomer(phone){if(mode==='supabase'){const sb=await supabase();const {data,error}=await sb.from('customers').select('*').eq('phone',phone).maybeSingle();if(error)throw error;return data?{...data,name:data.name||data.full_name}:null}return cache.customers.find(x=>x.phone===phone)||null}
export async function createSale(payload){if(mode!=='supabase')return {id:'DEMO-'+Date.now(),demo:true};const sb=await supabase();const {data,error}=await sb.from('sales').insert(payload).select().single();if(error)throw error;return data}
export async function audit(action,entity_type,entity_id=null,after_data=null){if(mode!=='supabase')return;const sb=await supabase();await sb.from('audit_logs').insert({action,entity_type,entity_id,after_data})}
