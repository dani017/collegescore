/*
 * College Inclusiveness Search Team
 * February 2025
 * Handles routes and server
 */


"use strict";

const express = require("express");
const app = express();

const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');

const multer = require("multer");

const USER_ERROR = 400;
const SERVER_ERROR = 500;

const SERVER_ERROR_MSG = "Uh oh! Something went wrong on the server."

/*-----------------New for Summer on Use */
// for application/x-www-form-urlencoded
app.use(express.urlencoded({extended: true})); // built-in middleware
// for application/json
app.use(express.json()); // built-in middleware
// for multipart/form-data (required with FormData)
app.use(multer().none()); // requires the "multer" module


/*****GETs*****/
/*Search Page*/
//Returns an array of all college information, ordered alphabetically by name (capstone code)
app.get('/colleges', async function(req, res) {
  try {
    let query = `
      SELECT *
      FROM Colleges
      ORDER BY
        (CASE
          WHEN LOWER(name) LIKE '%university%' OR LOWER(name) LIKE '%college%' THEN 1
          ELSE 0
        END) DESC,
        name ASC
    `;
    let rows = await runSQLQuery(db => db.all(query));
    res.json(rows);
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});


//Returns all information about one college (capstone code)
app.get('/colleges/:name', async function(req, res) {
  try {
    let name = req.params["name"];
    let query = "SELECT * FROM Colleges WHERE name = ?";
    let row = await runSQLQuery(db => db.get(query, name));
    res.json(row);
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});

//Returns an array of all names of colleges, ordered alphabetically (capstone code)
app.get('/college-names', async function(req, res) {
  try {
    let query = "SELECT name FROM Colleges ORDER BY name";
    let rows = await runSQLQuery(db => db.all(query));
    let collegeNames = [];
    for (let i = 0; i < rows.length; i++) {
      collegeNames.push(rows[i]["name"]);
    }
    res.json(collegeNames);
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});

//Finds all colleges that match or are similar to the search (capstone code)
app.get('/search/:search', async function(req, res) {
  try {
    let search = req.params["search"];
    // console.log("searching " + search);
    let query = "SELECT name FROM Colleges ORDER BY name";
    let rows = await runSQLQuery(db => db.all(query));
    let collegeNames = [];
    for (let i = 0; i < rows.length; i++) {
      if (areSimilar(search, rows[i]["name"])) {
        collegeNames.push(rows[i]["name"]);
      }
    }
    res.json(collegeNames);
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});

/*College Page*/
//Returns all written responses for a University 
app.get('/written-reviews/:college', async function(req, res) {
  try {
    let college = req.params["college"];
    let query = `SELECT share_id as self_id,
                 disability_accom as accom, written_rev as rev, written_experience as exp,
                 written_challenges as challenges, written_recs as recs,
                 FROM Responses WHERE college_name = ?`;

    let rows = await runSQLQuery(db => db.all(query, college));
   
    if (rows && rows.length > 0){
      res.json(rows) //match found
    } else{
      res.json(null) //no average
    }
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});

//Returns all the averaged accessability ratings from Responses table for a given university
app.get('/access-avgs/:college', async function(req, res) {
  try {
    let college = req.params["college"];
    let query = `SELECT AVG(disability_safety) AS safety_avg, 
                (AVG(disability_inclusion) + AVG(disability_bias))/2 AS inclusion_avg, 
                (AVG(disability_accessibility) + AVG(disability_peer) + AVG(disability_inst))/3 AS access_avg 
                FROM Responses WHERE LOWER(TRIM(college_name)) = LOWER(TRIM(?)) 
                `; 
    let rows = await runSQLQuery(db => db.get(query, college));
    res.json(rows)
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});

// Top N schools by highest accessibility rating
app.get('/top-access', async function(req, res) {
  try {
    let query = `
      SELECT r.college_name, c.location,
             AVG(r.disability_safety) AS safety_avg, 
             (AVG(r.disability_inclusion) + AVG(r.disability_bias))/2 AS inclusion_avg, 
             (AVG(r.disability_accessibility) + AVG(r.disability_peer) + AVG(r.disability_inst))/3 AS access_avg 
      FROM Responses r
      JOIN Colleges c ON LOWER(TRIM(r.college_name)) = LOWER(TRIM(c.name))
      GROUP BY r.college_name
      ORDER BY access_avg DESC
      LIMIT 100
    `;
    let rows = await runSQLQuery(db => db.all(query));
    res.json(rows);
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});

// Top N schools by highest inclusion rating
app.get('/top-inclusion', async function(req, res) {
  try {
    let query = `
      SELECT r.college_name, c.location,
             AVG(r.disability_safety) AS safety_avg, 
             (AVG(r.disability_inclusion) + AVG(r.disability_bias))/2 AS inclusion_avg, 
             (AVG(r.disability_accessibility) + AVG(r.disability_peer) + AVG(r.disability_inst))/3 AS access_avg 
      FROM Responses r
      JOIN Colleges c ON LOWER(TRIM(r.college_name)) = LOWER(TRIM(c.name))
      GROUP BY r.college_name
      ORDER BY inclusion_avg DESC
      LIMIT 100
    `;
    let rows = await runSQLQuery(db => db.all(query));
    res.json(rows);
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});

// Top N schools by highest accessibility rating
app.get('/top-safety', async function(req, res) {
  try {
    let query = `
      SELECT r.college_name, c.location,
             AVG(r.disability_safety) AS safety_avg, 
             (AVG(r.disability_inclusion) + AVG(r.disability_bias))/2 AS inclusion_avg, 
             (AVG(r.disability_accessibility) + AVG(r.disability_peer) + AVG(r.disability_inst))/3 AS access_avg 
      FROM Responses r
      JOIN Colleges c ON LOWER(TRIM(r.college_name)) = LOWER(TRIM(c.name))
      GROUP BY r.college_name
      ORDER BY safety_avg DESC
      LIMIT 100
    `;
    let rows = await runSQLQuery(db => db.all(query));
    res.json(rows);
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});



//Return demographics 
//Do not start using this data until a college has over 50 responses, 
//on college page if this information is null return a message of "We need more reviews before displaying this information!"
app.get('/dem/:college', async function(req, res){
  try{
    let college = req.params["college"];
    let query =`
                SELECT AVG(lgbtq_id = 'Yes')*100  AS lgbtq_perc,
                AVG(poc_id = 'Yes')*100  AS poc_perc,
                AVG(disability_id = 'Yes')*100  AS disability_perc
                FROM Responses WHERE college_name = ?
                GROUP BY college_name = ?
                HAVING COUNT(*) > 50
              `;
    let rows = await runSQLQuery(db => db.get(query,college));
    res.json(rows);
  }catch (err){
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }


});


/*****POSTs*****/
/*Survey */
//submit response to the Response table *summer 25 version
app.post('/submit-response/:college', async function(req, res){
  try{
    console.log("Recived survey data: ", req.body);
    let{
      college_name,
      college_attended = null,
      attendance_years_start = null,
      attendance_years_end = null,
      lgbt_id = null,
      poc_id = null,
      disability_id = null,
      optin = null,
      share_id = null,
      lgbt_safety = null,
      lgbt_harm = null,
      lgbt_inclusion = null,
      lgbt_bias = null,
      lgbt_peer = null,
      lgbt_inst = null,
      poc_safety = null,
      poc_harm = null,
      poc_inclusion = null,
      poc_bias = null,
      poc_peer = null,
      poc_inst = null,
      disability_safety = null,
      disability_harm = null,
      disability_inclusion = null,
      disability_bias = null,
      disability_access = null,
      disability_peer = null,
      disability_inst = null,
      disability_accom = null,
      written_rev = null,
      written_exp = null,
      written_challenges = null,
      written_recs = null } = req.body;
    let query = "INSERT INTO Responses"
              //intro
              + "(college_name,"
              + " college_attended, attendance_years_start, attendance_years_end," // <-- add here
              + " lgbt_id, poc_id, disability_id,"
              + " optin, share_id,"
              //lgbt
              + " lgbt_safety, lgbt_harm,"
              + " lgbt_inclusion, lgbt_bias," 
              + " lgbt_peer, lgbt_inst,"
              //poc
              + " poc_safety, poc_harm,"
              + " poc_inclusion, poc_bias," 
              + " poc_peer, poc_inst,"
              //disability
              + " disability_safety, disability_harm,"
              + " disability_inclusion, disability_bias," 
              + " disability_peer, disability_inst,"
              + " disability_accessibility, disability_accom,"
              //intersectional/general
              + " written_rev, written_experience,"
              + " written_challenges, written_recs)"
              + " VALUES(?, ?, ?, ?, ?, ?," //intro
                      + "?, ?, ?," //attendance
                      + "?, ?, ?, ?, ?, ?,"//lgbt
                      + "?, ?, ?, ?, ?, ?,"//poc
                      + "?, ?, ?, ?, ?, ?, ?, ?,"//disability
                      + "?, ?, ?, ?)";//general

    //map req.body values defined above to columns they add to 
    await runSQLQuery(db => db.run(query, [
              college_name,
              college_attended, attendance_years_start, attendance_years_end, // <-- add here
              lgbt_id, poc_id, disability_id,
              optin, share_id,
              //lgbt
              lgbt_safety, lgbt_harm,
              lgbt_inclusion, lgbt_bias, 
              lgbt_peer, lgbt_inst,
              //poc
              poc_safety, poc_harm,
              poc_inclusion, poc_bias, 
              poc_peer, poc_inst,
              //disability
              disability_safety, disability_harm,
              disability_inclusion, disability_bias, 
              disability_peer, disability_inst,
              disability_access, disability_accom,
              //intersectional/general
              written_rev, written_exp,
              written_challenges, written_recs]));
    res.type("text");
    res.send("Survey submitted successfully");
  }catch (err){
    res.status(SERVER_ERROR).type("text");
    console.error("Database insert error:", err);
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});

//Returns all survey responses for a University (capstone code)
app.get('/all-responses/:college', async function(req, res) {
  try {
    let college = req.params["college"];
    let query = `
      SELECT 
        written_rev,
        written_experience,
        written_challenges,
        written_recs,
        disability_safety AS safety_score,
        (disability_inclusion + disability_bias) / 2.0 AS inclusivity_avg,
        (disability_accessibility + disability_peer + disability_inst) / 3.0 AS accessibility_avg,
        (
          disability_safety
          + ((disability_inclusion + disability_bias) / 2.0)
          + ((disability_accessibility + disability_peer + disability_inst) / 3.0)
        ) / 3.0 AS overall_score
      FROM Responses
      WHERE college_name = ?
    `;
    let rows = await runSQLQuery(db => db.all(query, college));
    if (rows && rows.length > 0) {
      res.json(rows); // match found
    } else {
      res.json(null); // no responses
    }
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});


//Returns all the averaged ratings from Reviews table for a given university (capstone code)
app.get('/resp-rating-avgs/:college', async function(req, res) {
  try {
    let college = req.params["college"];
    let query = `
      SELECT AVG(disability_safety) AS safety_avg,
             (AVG(disability_inclusion) + AVG(disability_bias)) / 2 AS inclusivity_avg,
             (AVG(disability_accessibility) + AVG(disability_peer) + AVG(disability_inst)) / 3 AS accessibility_avg,
             (
               AVG(disability_safety)
               + ((AVG(disability_inclusion) + AVG(disability_bias)) / 2)
               + ((AVG(disability_accessibility) + AVG(disability_peer) + AVG(disability_inst)) / 3)
             ) / 3 AS overall_avg
      FROM Responses WHERE college_name = ?
    `;
    let rows = await runSQLQuery(db => db.get(query, college));
    res.json(rows);
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});

/*----------------------------OLD FROM Winter 24/25, Not using------------------------------------ */

//Returns all survey responses for a University (capstone code)
app.get('/all-reviews/:college', async function(req, res) {
  try {
    let college = req.params["college"];
    let query = "SELECT * FROM Reviews WHERE college_name = ?";

    let rows = await runSQLQuery(db => db.all(query, college));
   
    if (rows && rows.length > 0){
      res.json(rows) //match found
    } else{
      res.json(null) //no average
    }
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});


//Returns all the averaged ratings from Reviews table for a given university (capstone code)
app.get('/rating-avgs/:college', async function(req, res) {
  try {
    let college = req.params["college"];
    let query = "SELECT AVG(lgbtq_safety)         AS lgbtq_avg," 
              + " AVG(accommodations_difficulty)  AS difficulty_avg,"
              + " AVG(reliability_rating)         AS reliability_avg,"
              + " AVG(accommodation_rating)       AS rating_avg," 
              + " AVG(outside_rating)             AS outside_avg," 
              + " AVG(inside_accessibility)       AS inside_avg," 
              + " AVG(liberal_rating)             AS liberal_avg," 
              + " AVG(diversity_rating)           AS diversity_avg," 
              + " AVG(tolerance_rating)           AS tolerance_avg," 
              + " AVG(supportive_rating)          AS supportive_avg," 
              + " AVG(clubs_rating)               AS clubs_avg,"
              + " AVG(overallAccess_rating)       AS overallAccess_avg," 
              + " AVG(overallIdentity_rating)     AS overallIdentity_avg" 
              + " FROM Reviews WHERE college_name = ?";
    let rows = await runSQLQuery(db => db.get(query, college));
    res.json(rows) //match found
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});

//Return Y/N stats for a given college (capstone code)
app.get('/stats/:college', async function(req, res){
  try{
    let college = req.params["college"];
    let query = "SELECT AVG(exclusionary = 'Yes')*100  AS exclusionary_score,"
              +" AVG(friendly = 'Yes')*100 AS friendly_score,"
              +" AVG(lgbtq_id = 'Yes')*100  AS lgbtq_score,"
              +" AVG(mobility = 'Yes')*100  AS mobility_score"
              +" FROM Reviews WHERE college_name = ?";
    let rows = await runSQLQuery(db => db.get(query,college));
    res.json(rows);
  }catch (err){
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }


});



//Adds a survey response to the Reviews table *winter 24-25 version (capstone code)
app.post('/submit-survey/:college', async function(req, res){
  try{
    console.log("Recieved survey data: ", req.body);
    let {
      college_name,
      identities_list = "",
      race = "",
      disability_identity = "",
      gender = "",
      sexual_orientation = "",
      optin = "",
      lgbtq_id = "",
      lgbtq_safety = null, // Default to NULL for numbers
      exclusionary = "",
      friendly = "",
      accommodations_difficulty = null,
      reliability_rating = null,
      timeliness = "",
      accommodation_rating = null,
      mobility = "",
      outside_rating = null,
      inside_accessibility = null,
      liberal_rating = null,
      diversity_rating = null,
      tolerance_rating = null,
      supportive_rating = null,
      clubs_rating = null,
      overallAccess_rating = null,
      overallIdentity_rating = null,
      general_review = "",
      identity_review = ""} = req.body;
  

    let query ="INSERT INTO Reviews"
              +"(college_name," 
              +" identities_list, race," 
              +" disability_identity, gender," 
              +" sexual_orientation, optin," 
              +" lgbtq_id, lgbtq_safety,"
              +" exclusionary, friendly,"
              +" accommodations_difficulty, reliability_rating,"
              +" timeliness, accommodation_rating," 
              +" mobility, outside_rating,"
              +" inside_accessibility, liberal_rating," 
              +" diversity_rating, tolerance_rating,"
              +" supportive_rating, clubs_rating," 
              +" overallAccess_rating, overallIdentity_rating,"
              +" general_review, identity_review)"
              +"VALUES (?, ?, ?,"
                      +"?, ?, ?, ?,"
                      +"?, ?, ?, ?,"
                      +"?, ?, ?, ?,"
                      +"?, ?, ?, ?,"
                      +"?, ?, ?, ?,"
                      +"?, ?, ?, ?)";
      //map req.body values defined above to columns they add to 
      await runSQLQuery(db => db.run(query, [
        college_name, 
        identities_list, race, 
        disability_identity, gender, 
        sexual_orientation, optin,
        lgbtq_id, lgbtq_safety,
        exclusionary, friendly,
        accommodations_difficulty, reliability_rating,
        timeliness, accommodation_rating,
        mobility, outside_rating,
        inside_accessibility, liberal_rating,
        diversity_rating, tolerance_rating,
        supportive_rating, clubs_rating,
        overallAccess_rating, overallIdentity_rating,
        general_review, identity_review]));
    res.type("text");
    res.send("Survey submitted successfully");
  }catch (err){
    res.status(SERVER_ERROR).type("text");
    console.error("Database insert error:", err);
    res.send(SERVER_ERROR_MSG + ": " + err);
  }


});


/*below are the gets for individual avgs, delete?*/
// returns the overall/average lgbtq+ safety rating for a given university (capstone code)
app.get('/lgbtq-avg/:college', async function(req, res) {
  try {
    let college = req.params["college"];
    let query = "SELECT AVG(lgbtq_safety) AS lgbtq_avg FROM Reviews WHERE college_name = ?";
    let row = await runSQLQuery(db => db.get(query, college));
   
    if (row){
      res.json(row.lgbtq_avg) //match found
    } else{
      res.json(null)
    }
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});

//get overall/average accommodation difficulty rating for a given university
app.get('/difficulty-avg/:college', async function(req, res) {
  try {
    let college = req.params["college"];
    let query = "SELECT AVG(accommodations_difficulty) AS difficulty_avg FROM Reviews WHERE college_name = ?";
    let row = await runSQLQuery(db => db.get(query, college));
   
    if (row){
      res.json(row.difficulty_avg) //match found
    } else{
      res.json(null)
    }
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});

//get overall/average reliability rating for a given university
app.get('/reliability-avg/:college', async function(req, res) {
  try {
    let college = req.params["college"];
    let query = "SELECT AVG(reliability_rating) AS reliability_avg FROM Reviews WHERE college_name = ?";
    let row = await runSQLQuery(db => db.get(query,[college]));
   
    if (row){
      res.json(row.reliability_avg) //match found
    } else{
      res.json(null)
    }
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});

//get overall/average accomodations-rating for a given university
app.get('/accommodation-avg/:college', async function(req, res) {
  try {
    let college = req.params["college"];
    let query = "SELECT AVG(accommodation_rating) AS accommodation_avg FROM Reviews WHERE college_name = ?";
    let row = await runSQLQuery(db => db.get(query, college));
   
    if (row){
      res.json(row.accommodation_avg) //match found
    } else{
      res.json(null)
    }
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});

//get overall/average outside rating for a given university
app.get('/outside-avg/:college', async function(req, res) {
  try {
    let college = req.params["college"];
    let query = "SELECT AVG(outside_rating) AS outside_avg FROM Reviews WHERE college_name = ?";
    let row = await runSQLQuery(db => db.get(query,[college]));
   
    if (row){
      res.json(row.outside_avg) //match found
    } else{
      res.json(null)
    }
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});

//get overall/average inside accessibility for a given university
app.get('/inside-avg/:college', async function(req, res) {
  try {
    let college = req.params["college"];
    let query = "SELECT AVG(inside_accessibility) AS inside_avg FROM Reviews WHERE college_name = ?";
    let row = await runSQLQuery(db => db.get(query,[college]));
   
    if (row){
      res.json(row.inside_avg) //match found
    } else{
      res.json(null)
    }
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});

//get overall/average liberal rating for a given university
app.get('/liberal-avg/:college', async function(req, res) {
  try {
    let college = req.params["college"];
    let query = "SELECT AVG(liberal_rating) AS liberal_avg FROM Reviews WHERE college_name = ?";
    let row = await runSQLQuery(db => db.get(query,[college]));
   
    if (row){
      res.json(row.liberal_avg) //match found
    } else{
      res.json(null)
    }
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});

//get overall/average toelerance rating for a given univerity 
app.get('/tolerance-avg/:college', async function(req, res) {
  try {
    let college = req.params["college"];
    let query = "SELECT AVG(tolerance_rating) AS tolerance_avg FROM Reviews WHERE college_name = ?";
    let row = await runSQLQuery(db => db.get(query,[college]));
   
    if (row){
      res.json(row.tolerance_avg) //match found
    } else{
      res.json(null)
    }
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});

//get average diversity-rating for a given university
app.get('/diversity-avg/:college', async function(req, res) {
  try {
    let college = req.params["college"];
    let query = "SELECT AVG(diversity_rating) AS diversity_avg FROM Reviews WHERE college_name = ?";
    let row = await runSQLQuery(db => db.get(query,[college]));
   
    if (row){
      res.json(row.diversity_avg) //match found
    } else{
      res.json(null)
    }
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});

//get overall/average supportive rating for a given university
app.get('/supportive-avg/:college', async function(req, res) {
  try {
    let college = req.params["college"];
    let query = "SELECT AVG(supportive_rating) AS supportive_avg FROM Reviews WHERE college_name = ?";
    let row = await runSQLQuery(db => db.get(query,[college]));
   
    if (row){
      res.json(row.supportive_avg) //match found
    } else{
      res.json(null) //no average
    }
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});

//get overall/average clubs rating for a given university
app.get('/clubs-avg/:college', async function(req, res) {
  try {
    let college = req.params["college"];
    let query = "SELECT AVG(clubs_rating) AS clubs_avg FROM Reviews WHERE college_name = ?";
    let row = await runSQLQuery(db => db.get(query,[college]));
   
    if (row){
      res.json(row.clubs_avg) //match found
    } else{
      res.json(null) //no average
    }
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});

//get overall/average overallAccess rating for a given university 
app.get('/overallAccess-avg/:college', async function(req, res) {
  try {
    let college = req.params["college"];
    let query = "SELECT AVG(overallAccess_rating) AS overallAccess_avg FROM Reviews WHERE college_name = ?";
    let row = await runSQLQuery(db => db.get(query,[college]));
   
    if (row){
      res.json(row.overallAccess_avg) //match found
    } else{
      res.json(null) //no average
    }
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});

//get overall/average overallIdentity rating for a given university 
app.get('/overallIdentity-avg/:college', async function(req, res) {
  try {
    let college = req.params["college"];
    let query = "SELECT AVG(overallIdentity_rating) AS overallIdentity_avg FROM Reviews WHERE college_name = ?";
    let row = await runSQLQuery(db => db.get(query,[college]));
   
    if (row){
      res.json(row.overallIdentity_avg) //match found
    } else{
      res.json(null) //no average
    }
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG + ": " + err);
  }
});


/** EXAMPLE GET/POST requests belows, NOT for our use!! */

// get all yip data, or yip data matching a particular search
app.get('/yipper/yips', async function(req, res) {
  try {
    let search = req.query["search"];
    let query;
    let rows;
    if (search) {
      query = "SELECT id FROM yips WHERE yip LIKE ? ORDER BY id";
      rows = await runSQLQuery(db => db.all(query, "%" + search + "%"));
    } else {
      query = "SELECT id, name, yip, hashtag, likes, date FROM yips";
      query += " ORDER BY DATETIME(date) DESC";
      rows = await runSQLQuery(db => db.all(query));
    }
    res.json({
      "yips": rows
    });
  } catch (err) {
    res.status(SERVER_ERROR).type("text");
    res.send(SERVER_ERROR_MSG);
  }
});

// update likes of a yip
app.post('/yipper/likes', async function(req, res) {
  let id = req.body["id"];
  if (id) {
    try {
      let query = "SELECT likes FROM yips WHERE id = ?";
      let row = await runSQLQuery(db => db.get(query, String(id)));
      if (!row) {
        res.status(USER_ERROR).type("text");
        res.send(ID_NOT_EXIST_MSG);
      } else {
        let newLikes = row["likes"] + 1;
        query = "UPDATE yips SET likes = ? WHERE id = ?";
        await runSQLQuery(db => db.run(query, String(newLikes), String(id)));
        res.type("text");
        res.send(String(newLikes));
      }
    } catch (err) {
      res.status(SERVER_ERROR).type("text");
      res.send(SERVER_ERROR_MSG);
    }
  } else {
    res.status(USER_ERROR).type("text");
    res.send(MISSING_PARAM_MSG);
  }
});

/*   OTHER HELPERS   */

/**
 * Runs a SQL query based on passed-in function dbFunc
 * @param {function} dbFunc - function to call on db, must have param db
 * @returns {object} result of calling dbFunc(db);
 * @throws error if error is caught
 */
async function runSQLQuery(dbFunc) {
  try {
    let db = await getDBConnection();
    let res = await dbFunc(db);
    await db.close();
    return res;
  } catch (err) {
    throw err;
  }
}

/*   SOME HELPER FUNCTIONS   */

/**
 * Establishes a database connection to a database and returns the database object.
 * Any errors that occur during connection should be caught in the function
 * that calls this one.
 * @returns {Object} - The database object for the connection.
 */
async function getDBConnection() {
  const db = await sqlite.open({
    filename: 'colleges.db',
    driver: sqlite3.Database
  });
  return db;
}

/**
 * AI-generated helper function
 * Calculates similarity between two strings using exact and fuzzy matching
 * @param {string} str1 - First string to compare
 * @param {string} str2 - Second string to compare
 * @param {number} [threshold=0.8] - Similarity threshold (0 to 1) for fuzzy matching
 * @returns {boolean} - True if strings are similar, false otherwise
 */
function areSimilar(str1, str2, threshold = 0.4) {
  // Handle null, undefined, or empty inputs
  if (!str1 || !str2) {
      return str1 === str2;
  }

  // First try exact match (case-insensitive)
  if (str1.toLowerCase() === str2.toLowerCase()) {
      return true;
  }

  // Then check if each string exists in the other
  if (str1.toLowerCase().includes(str2.toLowerCase()) ||
      str2.toLowerCase().includes(str1.toLowerCase())) {
      return true;
  }


  // If not exact match, try fuzzy matching
  return getFuzzySimilarity(str1, str2) >= threshold;
}

/**
 * AI-generated helper function
 * Calculates fuzzy similarity score between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score between 0 and 1
 */
function getFuzzySimilarity(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(s1, s2);

  // Convert distance to similarity score
  const maxLength = Math.max(s1.length, s2.length);
  const similarity = 1 - (distance / maxLength);

  return similarity;
}

/**
 * AI-generated helper function
 * Calculates the Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - The minimum number of single-character edits needed
 */
function levenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1).fill(null)
      .map(() => Array(str1.length + 1).fill(null));

  // Fill first row and column
  for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
  }

  // Fill rest of the matrix
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

// serve the main page under public
app.use(express.static('public'));
const DEFAULT_PORT = 8000;
const PORT = process.env.PORT || DEFAULT_PORT;
app.listen(PORT);