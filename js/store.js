
const KEY='bigbear_alpha_db';
let cache=null;
async function seed(){if(cache)return cache;const saved=localStorage.getItem(KEY);if(saved){cache=JSON.parse(saved);return cache}const res=await fetch('data/demo.json');cache=await res.json();localStorage.setItem(KEY,JSON.stringify(cache));return cache}
await seed();
export function store(){return cache}
export function save(){localStorage.setItem(KEY,JSON.stringify(cache))}
export async function resetStore(){localStorage.removeItem(KEY);cache=null;await seed()}
