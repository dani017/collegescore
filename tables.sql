CREATE TABLE "Colleges" (
	"name"	                          TEXT,
	"location"                        TEXT,
  "campus_size"	                    NUMERIC,
	"accommodations"	                TEXT,
	"resources"	                      TEXT,
	PRIMARY KEY("name")
);

CREATE TABLE "Reviews" (
	"id"	                            INTEGER NOT NULL,
  "college_name"                    TEXT,
	"identities_list"                 TEXT,
  "race"	                          TEXT,
	"disability_identity"	            TEXT,
	"gender"	                        TEXT,
	"sexual_orientation"	            TEXT,
	"optin"	                          TEXT,
	"lgbtq_id"	                      TEXT,  -- Yes/No
	"lgbtq_safety"	                  INTEGER, -- chk
	"exclusionary"	                  TEXT,  -- Yes/No
	"friendly"	                      TEXT,  -- Yes/No
	"lgbtqRec"	                      TEXT,
	"accommodations_difficulty"	      INTEGER,
	"reliability_rating"	            INTEGER,
	"timeliness"	                    TEXT,
	"accommodation_rating"	          INTEGER, -- chk
	"mobility"	                      TEXT,  -- Yes/No
	"outside_rating"	                INTEGER, -- chk
	"inside_accessibility"	          INTEGER, -- chk
	"accessibility"	                  TEXT,
	"liberal_rating"	                INTEGER, -- chk
	"gender_inclusivity"	            TEXT,
	"diversity_rating"	              INTEGER,
	"tolerance_rating"	              INTEGER,
	"supportive_rating"	              INTEGER, -- chk
	"clubs_rating"	                  INTEGER,
	"overallAccess_rating"	          INTEGER, -- chk
	"overallIdentity_rating"	        INTEGER, -- chk
	"general_review"	                TEXT,
	"identity_review"	                TEXT,
	PRIMARY KEY("id"),
  FOREIGN KEY ("college_name") REFERENCES Colleges("name")
);

CREATE TABLE "Responses"(
	"id"						INTEGER NOT NULL,
	"college_name"				TEXT,
	"college_attended"			TEXT,
	"college_attendance_year_start"	INTEGER,
	"college_attendance_year_end"	INTEGER,
	"lgbt_id"					TEXT,
	"poc_id"					TEXT,
	"disability_id"				TEXT,
	"optin"						TEXT,
	"share_id"					TEXT,
	"lgbt_safety"				INTEGER,
	"lgbt_harm"					TEXT,
	"lgbt_inclusion"			INTEGER,
	"lgbt_bias"					INTEGER,
	"lgbt_peer"					INTEGER,
	"lgbt_inst"					INTEGER,
	"poc_safety"				INTEGER,
	"poc_harm"					TEXT,
	"poc_inclusion"				INTEGER,
	"poc_bias"					INTEGER,
	"poc_peer"					INTEGER,
	"poc_inst"					INTEGER,
	"disability_safety"			INTEGER,
	"disability_harm"			TEXT,
	"disability_inclusion"		INTEGER,
	"disability_bias"			INTEGER,
	"disability_accessibility"	INTEGER,
	"disability_peer"			INTEGER,
	"disability_inst"			INTEGER,
	"disability_accom"			TEXT,
	"written_rev"				TEXT,
	"written_experience"		TEXT,
	"written_challenges"		TEXT,
	"written_recs"				TEXT,
	PRIMARY KEY("id"),
  	FOREIGN KEY ("college_name") REFERENCES Colleges("name")
);