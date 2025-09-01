DELETE FROM Reviews;
DELETE FROM Colleges;

-- testing data
INSERT INTO "Colleges"
  ("name", "location", "campus_size", "accommodations", "resources")
VALUES
  ("University of Washington", "WA", "700",
   '["Accessible Parking", "Accessible Materials"]',
   '[]'),
  ("Yale University", "CT", "1100",
   '["BIPOC-inclusive", "Religion-inclusive"]',
   '[]'),
  ("Stanford University", "CA", "8200",
   '["BIPOC-inclusive", "Accessible Parking"]',
   '[]');


INSERT INTO "Reviews"
  ("college_name",
  "general_review",
  "lgbtq_safety",         "accommodations_difficulty", "reliability_rating", "accommodation_rating", "outside_rating",            "inside_accessibility", "liberal_rating",       "diversity_rating",          "tolerance_rating",
  "supportive_rating",    "clubs_rating",              "overallAccess_rating", "overallIdentity_rating")
VALUES
  (
    "University of Washington",
    "it's not so bad here, i'm getting lit with my greek fam, but i think if you're looking for somewhere to fit in, this place is mostly welcoming towards BIPOC and queer students",
    1, 2, 3,
    4, 5, 1,
    2, 3, 4,
    3, 2, 1,
    2
  ),
  (
    "Yale University",
    "i just wanna graduate :(( but at least accomodations are easy to get here, super available and fast",
    3, 4, 5,
    1, 2, 5,
    2, 1, 4,
    5, 5, 4,
    5
  ),
  (
    "University of Washington",
    "sorry i don't feel like typing a lot today",
    2, 5, 2,
    5, 2, 5,
    2, 5, 2,
    5, 2, 5,
    5
  ),
  (
    "Stanford University",
    "sorry i don't feel like typing a lot today",
    2, 5, 2,
    5, 2, 5,
    2, 5, 2,
    5, 2, 5,
    5
  ),
  (
    "Stanford University",
    "hello internet, stanford is ok-ish for most folks with intersecting identities",
    2, 1, 2,
    5, 2, 1,
    2, 1, 2,
    1, 2, 5,
    5
  );