-- Fake data only — Charleston neighborhoods are real, every studio name,
-- address, phone, and review count below is invented. Never put a real
-- studio's data in this file; it's committed to git.
--
-- Before running: replace every 'REPLACE_WITH_YOUR_USER_ID' below with your
-- actual Supabase auth user id (Authentication > Users > copy the UUID,
-- after you've created your one account per README.md "Supabase setup").

-- Franchise brand seed list (mirrors lib/franchise-list.ts — keep in sync
-- if you edit one, edit the other) -------------------------------------------

insert into franchise_brands (owner_id, brand_name, match_patterns, always_exclude) values
  ('REPLACE_WITH_YOUR_USER_ID', 'btone FITNESS', array['btone'], true),
  ('REPLACE_WITH_YOUR_USER_ID', 'Barry''s', array['barry''s', 'barrys'], false),
  ('REPLACE_WITH_YOUR_USER_ID', 'BODYROK', array['bodyrok'], false),
  ('REPLACE_WITH_YOUR_USER_ID', 'Peach Lab', array['peach lab'], false),
  ('REPLACE_WITH_YOUR_USER_ID', 'Jane DO', array['jane do'], false),
  ('REPLACE_WITH_YOUR_USER_ID', 'Club Pilates', array['club pilates'], false),
  ('REPLACE_WITH_YOUR_USER_ID', 'Pure Barre', array['pure barre'], false),
  ('REPLACE_WITH_YOUR_USER_ID', 'Orangetheory', array['orangetheory'], false),
  ('REPLACE_WITH_YOUR_USER_ID', 'F45', array['f45'], false),
  ('REPLACE_WITH_YOUR_USER_ID', 'CycleBar', array['cyclebar'], false),
  ('REPLACE_WITH_YOUR_USER_ID', 'YogaSix', array['yogasix', 'yoga six'], false),
  ('REPLACE_WITH_YOUR_USER_ID', 'HOTWORX', array['hotworx'], false),
  ('REPLACE_WITH_YOUR_USER_ID', 'Fly Dance Fitness', array['fly dance fitness'], false),
  ('REPLACE_WITH_YOUR_USER_ID', 'MADabolic', array['madabolic'], false),
  ('REPLACE_WITH_YOUR_USER_ID', 'StretchLab', array['stretchlab'], false),
  ('REPLACE_WITH_YOUR_USER_ID', 'Rumble', array['rumble'], false),
  ('REPLACE_WITH_YOUR_USER_ID', '[solidcore]', array['solidcore'], false);

-- Fake prospect studios, one per Charleston-metro neighborhood -----------------

insert into studios (
  owner_id, name, address, neighborhood, phone, website, instagram_handle,
  category, rating, review_count, is_franchise, booking_platform,
  booking_platform_source, on_classpass, intro_offer, class_price,
  estimated_size, pipeline_stage, notes
) values
  ('REPLACE_WITH_YOUR_USER_ID', 'Harbor Light Pilates', '123 King St, Charleston, SC', 'downtown_peninsula', '843-555-0101', 'https://harborlightpilates.example.com', '@harborlightpilates', 'pilates', 4.8, 112, false, 'mindbody', 'manual', true, '3 classes for $59', 32, 'small', 'researched', 'Fake seed data for demo/testing.'),
  ('REPLACE_WITH_YOUR_USER_ID', 'Shem Creek Yoga Collective', '456 Coleman Blvd, Mount Pleasant, SC', 'mount_pleasant', '843-555-0102', 'https://shemcreekyoga.example.com', '@shemcreekyoga', 'yoga', 4.9, 203, false, 'momence', 'auto', false, '1 week unlimited for $39', 22, 'medium', 'secret_shopped', 'Fake seed data for demo/testing.'),
  ('REPLACE_WITH_YOUR_USER_ID', 'West Ashley Barre Co.', '789 Savannah Hwy, Charleston, SC', 'west_ashley', '843-555-0103', 'https://wabarreco.example.com', '@wabarreco', 'barre', 4.6, 87, false, 'walla', 'auto', true, 'First class free', 28, 'small', 'contacted', 'Fake seed data for demo/testing.'),
  ('REPLACE_WITH_YOUR_USER_ID', 'James Island Strength Lab', '321 Folly Rd, James Island, SC', 'james_island', '843-555-0104', 'https://jistrengthlab.example.com', '@jistrengthlab', 'strength', 4.7, 64, false, 'unknown', 'auto', false, '2-week trial for $49', 25, 'medium', 'researched', 'Fake seed data for demo/testing.'),
  ('REPLACE_WITH_YOUR_USER_ID', 'Daniel Island Ride House', '150 Seven Farms Dr, Daniel Island, SC', 'daniel_island', '843-555-0105', 'https://diridehouse.example.com', '@diridehouse', 'cycle', 4.9, 156, false, 'mariana_tek', 'auto', true, '3 rides for $69', 30, 'medium', 'meeting_booked', 'Fake seed data for demo/testing.'),
  ('REPLACE_WITH_YOUR_USER_ID', 'Park Circle HIIT House', '987 Montague Ave, North Charleston, SC', 'north_charleston_park_circle', '843-555-0106', 'https://parkcirclehiit.example.com', '@parkcirclehiit', 'hiit', 4.5, 41, false, 'pushpress', 'manual', false, 'Free intro class', 27, 'small', 'researched', 'Fake seed data for demo/testing.'),
  ('REPLACE_WITH_YOUR_USER_ID', 'Summerville Flow Studio', '200 N Main St, Summerville, SC', 'summerville', '843-555-0107', 'https://summervilleflow.example.com', '@summervilleflow', 'yoga', 4.8, 98, false, 'vagaro', 'auto', true, '2 weeks for $49', 24, 'small', 'lost', 'Fake seed data for demo/testing. Lost reason: went with a competitor agency.');

update studios set lost_reason = 'Chose a competitor agency' where name = 'Summerville Flow Studio';

-- One secret-shop log per fake studio, varied channels/response times ----------

insert into secret_shop_logs (owner_id, studio_id, channel, sent_at, first_reply_at, replied_within_72h, reply_quality, offered_booking, notes)
select
  'REPLACE_WITH_YOUR_USER_ID',
  s.id,
  case s.name
    when 'Harbor Light Pilates' then 'web_form'
    when 'Shem Creek Yoga Collective' then 'instagram_dm'
    when 'West Ashley Barre Co.' then 'phone'
    when 'James Island Strength Lab' then 'email'
    when 'Daniel Island Ride House' then 'web_form'
    when 'Park Circle HIIT House' then 'instagram_dm'
    when 'Summerville Flow Studio' then 'web_form'
  end,
  now() - interval '10 days',
  case s.name
    when 'Harbor Light Pilates' then now() - interval '10 days' + interval '3 hours'
    when 'Shem Creek Yoga Collective' then now() - interval '7 days' -- no reply yet (null-ish, see below)
    when 'West Ashley Barre Co.' then now() - interval '10 days' + interval '20 minutes'
    when 'James Island Strength Lab' then now() - interval '10 days' + interval '2 days'
    when 'Daniel Island Ride House' then now() - interval '10 days' + interval '45 minutes'
    when 'Park Circle HIIT House' then null
    when 'Summerville Flow Studio' then now() - interval '10 days' + interval '1 day'
  end,
  case s.name
    when 'Park Circle HIIT House' then false
    when 'Shem Creek Yoga Collective' then false
    else true
  end,
  case s.name
    when 'West Ashley Barre Co.' then 5
    when 'Daniel Island Ride House' then 5
    when 'Harbor Light Pilates' then 4
    when 'Summerville Flow Studio' then 3
    when 'James Island Strength Lab' then 2
    else null
  end,
  case s.name
    when 'West Ashley Barre Co.' then true
    when 'Daniel Island Ride House' then true
    when 'Harbor Light Pilates' then true
    else false
  end,
  'Fake seed data for demo/testing.'
from studios s
where s.owner_id = 'REPLACE_WITH_YOUR_USER_ID';
