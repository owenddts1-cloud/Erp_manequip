-- Cleanup helper functions to keep schema clean
DROP FUNCTION IF EXISTS public.get_or_create_ativo(text, text, text, text, text);
DROP FUNCTION IF EXISTS public.get_or_create_planejamento(uuid, text, text, text, integer[]);
DROP FUNCTION IF EXISTS public.upsert_preventiva_mensal(uuid, uuid, text, text, integer, integer, text, text, integer);