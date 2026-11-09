-- Keapr Training: property photos for listing assessments (run after 0018).
--
-- A private bucket. Admins upload through signed upload links; candidates
-- download a zip and see thumbnails through short-lived signed links, both
-- made by the server. No storage policies, so browsers can't list or read
-- it directly.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('assessment-photos', 'assessment-photos', false, 15728640, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
