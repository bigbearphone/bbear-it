-- BIGBEAR ONE / b bear-it / production-supabase-v1
-- SAFE verification + optional helper objects. Run in Supabase SQL Editor.
-- This script DOES NOT drop production tables and DOES NOT weaken RLS.

-- 1) Verify core tables discovered during pilot setup
select table_name
from information_schema.tables
where table_schema='public'
  and table_name in ('profiles','user_roles','branches','partners','customers','inventory_items','sales','finance_cases','documents','partner_commissions','audit_logs')
order by table_name;

-- 2) Verify RLS state
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relname in ('profiles','user_roles','branches','partners','customers','inventory_items','sales','finance_cases','documents','partner_commissions','audit_logs')
order by c.relname;

-- 3) Verify policies (no changes)
select schemaname,tablename,policyname,cmd,roles
from pg_policies
where schemaname='public'
order by tablename,policyname;

-- 4) Verify Auth/Profile/Role/Partner mapping
select p.id,p.full_name,p.email,p.phone,p.job_title,p.partner_id,
       ur.role, b.name as role_branch,
       pt.code as partner_code,pt.name as partner_name,pt.partner_type
from public.profiles p
left join public.user_roles ur on ur.user_id=p.id
left join public.branches b on b.id=ur.branch_id
left join public.partners pt on pt.id=p.partner_id
order by p.full_name,ur.role;
