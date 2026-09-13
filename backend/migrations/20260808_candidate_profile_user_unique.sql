-- A candidate has one current AI profile. Re-analysis updates this row and
-- repoints it to the latest resume instead of creating duplicate profiles.
CREATE UNIQUE INDEX IF NOT EXISTS candidate_profiles_user_id_unique
  ON candidate_profiles (user_id);
