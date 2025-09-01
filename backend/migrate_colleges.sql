-- .mode csv
-- .headers on

-- DROP TABLE IF EXISTS temp_colleges;

-- CREATE TEMP TABLE temp_colleges (
--     NAME TEXT,
--     STATE TEXT,
--     CITY TEXT,
--     COUNTY TEXT,
--     WEBSITE TEXT,
--     TOT_ENROLL NUMERIC,
--     NAICS_DESC TEXT,
--     TELEPHONE TEXT
-- );

-- .import UScollegesDataset.csv temp_colleges

-- INSERT OR IGNORE INTO Colleges (name, location, resources)
-- SELECT 
--     UPPER(NAME) AS name, 
--     STATE AS location, 
--     '[' || REPLACE(TELEPHONE, '"', '') || ' | ' || REPLACE(WEBSITE, '"', '') || ']' AS resources
-- FROM temp_colleges;

-- UPDATE Colleges
-- SET resources = 
--     '[' || TRIM(TRIM(Colleges.resources, '['), ']') || ' || ' || TRIM(TRIM(temp_colleges.TELEPHONE, '['), ']') || ' | ' || TRIM(TRIM(temp_colleges.WEBSITE, '['), ']') || ']'
-- FROM temp_colleges
-- WHERE UPPER(temp_colleges.NAME) = Colleges.name;

-- DELETE FROM Colleges WHERE name = 'NAME' OR name = 'STATE';


-- fix the [] for resources 
-- UPDATE Colleges
-- SET accommodations = '[]'
-- WHERE accommodations IS NULL;
-- Ensure "accommodations" column is not null


-- Update accommodations to include "dcc"
-- .mode csv
-- .headers on
-- DROP TABLE IF EXISTS temp_colleges_dcc;
-- CREATE TEMP TABLE temp_colleges_dcc (University TEXT);
-- .import Universties_with_dcc.csv temp_colleges_dcc


-- UPDATE Colleges
-- SET accommodations = 
--     CASE 
--         WHEN accommodations = '[]' THEN '["dcc"]'
--         ELSE REPLACE(accommodations, ']', ', "dcc"]')
--     END
-- WHERE name IN (
--     SELECT UPPER(name) FROM temp_colleges_dcc
-- );
