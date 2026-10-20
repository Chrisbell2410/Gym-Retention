-- Chris has decided to use a new btone FITNESS location — where he has a
-- personal relationship — as his pilot/model customer, rather than treating
-- btone as an excluded conflict-of-interest brand. This removes the hard
-- "never un-exclude btone" defense built in 0001_init.sql. See CLAUDE.md
-- "Decisions made" for the full reasoning. Run this in the Supabase SQL
-- Editor (Project > SQL Editor > New query), then Run.

drop trigger if exists franchise_brands_protect_btone on franchise_brands;
drop function if exists protect_btone_exclusion();

delete from franchise_brands where brand_name ilike '%btone%';
