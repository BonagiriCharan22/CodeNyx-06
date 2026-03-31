# Database reverted to PostgreSQL (original)

Firebase migration cancelled per user request.

**Next: Fix DATABASE_URL for Supabase** 
- Create backend/.env with: DATABASE_URL=postgresql://postgres.[password]@db.[project-ref].supabase.co:5432/postgres
- Get from Supabase dashboard → Settings → Database
