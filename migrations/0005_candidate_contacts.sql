-- candidate_contacts from platform migration 0005 (D16): the only place candidate
-- contact data lives. Safe to run again on a live database.

-- citext follows D40: create it only when it is still missing.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'extensions') THEN
    CREATE SCHEMA extensions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'citext') THEN
    CREATE EXTENSION citext WITH SCHEMA extensions;
  END IF;
  IF NOT has_schema_privilege('app_rw', 'extensions', 'USAGE') THEN
    GRANT USAGE ON SCHEMA extensions TO app_rw;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.candidate_contacts (
  candidate_id uuid PRIMARY KEY
    REFERENCES public.candidate_profiles (user_id) ON DELETE CASCADE,
  email extensions.citext NOT NULL,
  phone text,
  telegram text,
  linkedin_url text,
  website_url text,
  extra jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidate_contacts_phone_check
    CHECK (phone IS NULL OR phone ~ '^\+[1-9][0-9]{6,14}$'),
  CONSTRAINT candidate_contacts_telegram_check
    CHECK (
      telegram IS NULL
      OR telegram ~ '^[A-Za-z][A-Za-z0-9_]{4,31}$'
    ),
  CONSTRAINT candidate_contacts_linkedin_check
    CHECK (
      linkedin_url IS NULL
      OR (char_length(linkedin_url) <= 300 AND linkedin_url ~ '^https?://')
    ),
  CONSTRAINT candidate_contacts_website_check
    CHECK (
      website_url IS NULL
      OR (char_length(website_url) <= 300 AND website_url ~ '^https?://')
    )
);

CREATE OR REPLACE TRIGGER candidate_contacts_set_updated_at
BEFORE UPDATE ON public.candidate_contacts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

SELECT public.enable_rls_deny_all('public.candidate_contacts');
