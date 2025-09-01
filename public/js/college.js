/*
 * College Inclusiveness Search Team
 * February 2025
 */

"use strict";

import {
  getRequest,
  getCollegeDetails,
  getCollegeRatingAverages,
  getAllResponses,
  getCollegeStats
} from './api.js';

(async function() {
  window.addEventListener("load", () => {
      getCollegeData().then(() => init());
    }
  );

  let collegeName;
  let collegeData;
  let ratingAvgs;
  let reviews;

  /**
   * Sets up event listeners for the buttons.
   */
  function init() {
    // todo: initialize event listeners
    id("rate-btn").addEventListener("click", openRatingForm);

    const urlParams = new URLSearchParams(window.location.search);
    collegeName = urlParams.get("name");
    qs("#college-name").textContent = collegeName;

    /**
    let fakeData ={
      name: "University of Atlantis",
      drsLink: "#",
      inclusivity: "4.2",
      accessibility: "4.5",
      lgbqt: 4.5,
      accomodation: 3.0,
      outdoor: 4.0,
      indoor: 4.1,
      building: 4.4,
      gender: 3.5,
      cultural: 4.1,
      religious: 2.0,
      review: "I feel really safe here as a trans woman. The students and staff here are respectful about that. DRS was very timely in making sure I had all my accommodations ready to go before classes started."
    };*/
    updateCollegeInfo(ratingAvgs);
    populateAccomodations();
    populateReviews();
  }

  function populateAccomodations() {
    let accoms = JSON.parse(collegeData["accommodations"]);
    id("accoms").innerHTML = "";
    for (let i = 0; i < accoms.length; i++) {
      let accom = gen("li");
      accom.textContent = accoms[i];
      id("accoms").appendChild(accom);
    }
  }

  // returns style such that BG color is
  // poor (red): [1 - 2.9]
  // okay (yellow): [3 - 3.9]
  // good (green): [4.0 - 5.0]
  function getColor(num) {
    if (num < 3) {
      return "poor";
    } else if (num < 4) {
      return "okay";
    } else {
      return "good";
    }
  }

  // generates bar such that 1-5 -> 20% to 100% of bar filled
  function barStyle(num) {
    let numToNum = {
      1 : "one",
      2 : "two",
      3 : "three",
      4 : "four",
      5 : "five",
    }
    return numToNum[num] ? numToNum[num] : "";
  }

  function populateReviews() {
    id("n-ratings").textContent = reviews.length;
    for (let i = 0; i < reviews.length; i++) {
      console.log("populating review");
      let rev = reviews[i];
      let box = gen("div");
      box.classList.add("rating-box");
      box.innerHTML =
`
<div class="rating-header" aria-label="student review:">
    <div class="Overall-section">
      <h4>Overall</h4>
      <span id="bubble" tabindex="0" class="rating-score ${getColor(rev.overall_score)}">${rev.overall_score}</span>
    </div>
    <div class="review-text">
      <h4 >General Review</h4>
      <p  >${rev.general_review ? rev.general_review : "<em>No review provided.</em>"}</p>
      <h4  >Identity-focused Review</h4>
      <p  >${rev.identity_review ? rev.identity_review : "<em>No review provided.</em>"}</p>
    </div>
  </div>
  <div class="rating-category">
    <p  >Safety: ${rev.safety_score} out of 5</p>
    <div class="rating-bar ${barStyle(rev.safety_score)}"></div>
  </div>
  <div class="rating-category">
    <p  >Inclusivity: ${rev.inclusivity_avg} out of 5</p>
    <div class="rating-bar ${barStyle(rev.inclusivity_avg)}"></div>
  </div>
  <div class="rating-category">
    <p >Accessibility: ${rev.accessibility_avg} out of 5</p>
    <div class="rating-bar ${barStyle(rev.accessibility_avg)}"></div>
  </div>
</div>
`;
      id("reviews-right").appendChild(box);
    }
  }

  function openRatingForm() {
    window.open(`/surveyN.html?name=${encodeURIComponent(collegeName)}`, "_blank");//new window open
  }

  // round to exactly 1 decimal place
  // if 0 return "N/A"
  function round(num) {
    num = (Math.round(num * 100) / 100).toFixed(1);
    return num == 0 ? "N/A" : num;
  }
  
  //round percentages to a whole number
  function roundPerc(num) {
    num = (Math.round(num * 100) / 100).toFixed(0);
    return num == 0 ? "N/A" : num;
  }

  /**
   * Gets college data
   */
  async function getCollegeData() {
    const urlParams = new URLSearchParams(window.location.search);
    collegeName = urlParams.get("name");

    collegeData = await getCollegeDetails(collegeName);
    ratingAvgs = await getCollegeRatingAverages(collegeName);
    reviews = await getAllResponses(collegeName);
    //let percentData = await getCollegeStats(collegeName);
    for (const [key, value] of Object.entries(ratingAvgs)) {
      ratingAvgs[key] = round(ratingAvgs[key]);
    }
    reviews = await getRequest("/all-responses/" + collegeName, res => res.json());
    if (!reviews) reviews = []; // <-- Add this line

    // replace null with "N/A" in individual ratings
    for (let i = 0; i < reviews.length; i++) {
      let review = reviews[i];
      for (const [key, value] of Object.entries(review)) {
        review[key] = review[key] ? review[key] : "N/A";
      }
    }
  }

  async function updateCollegeInfo(data) {
  let percentData = await getRequest("/stats/" + collegeName, res => res.json());

  // debug
  console.log("percentData");
  console.log(percentData);

  id("lgbtq_id").textContent = roundPerc(percentData["friendly_score"]);
  id("exclusionary").textContent = roundPerc(percentData["exclusionary_score"]);
  id("friendly").textContent = roundPerc(percentData["lgbtq_score"]);
  id("mobility").textContent = roundPerc(percentData["mobility_score"]);

  //id("college-name").innerHTML = `<a href ="${data.drsLink}" target="_blank">${collegeName}</a>`;
  id("college-name").textContent = collegeName;
  // id("review-text").textContent = data.review;
  // id("college-info").classList.remove("hidden");

  let overall = qs("#overall .overall-display");
  overall.textContent = data["overall_avg"];
  overall.classList.remove("poor", "okay", "good");
  overall.classList.add(getColor(data["overall_avg"]));


  let accessibilityRating = qs("#accessibility-rating .rating-display");
  accessibilityRating.textContent = data["accessibility_avg"];
  accessibilityRating.classList.remove("poor", "okay", "good");
  accessibilityRating.classList.add(getColor(data["accessibility_avg"]));


  let safetyRating = qs("#safety-rating .rating-display");
  safetyRating.textContent = data["safety_avg"];
  safetyRating.classList.remove("poor", "okay", "good");
  safetyRating.classList.add(getColor(data["safety_avg"]));


  let inclusivityRating = qs("#inclusivity-rating .rating-display");
  inclusivityRating.textContent = data["inclusivity_avg"];
  inclusivityRating.classList.remove("poor", "okay", "good");
  inclusivityRating.classList.add(getColor(data["inclusivity_avg"]));

}


  /* --- HELPER FUNCTIONS --- */

  /**
   * Shows the view and hides all other views
   * @param {string} view - the view to show
   */
  function toggleView(view) {
    for (let i = 0; i < ALL_VIEWS.length; i++) {
      id(ALL_VIEWS[i]).classList.add("hidden");
    }
    id(view).classList.remove("hidden");
  }

  
  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} name - element ID.
   * @returns {object} - DOM object associated with id.
   */
  function id(name) {
    return document.getElementById(name);
  }

  /**
   * Returns first element matching selector.
   * @param {string} selector - CSS query selector.
   * @returns {object} - DOM object associated selector.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Returns all element matching selector.
   * @param {string} selector - CSS query selector.
   * @returns {object[]} - DOM object associated selector.
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }

  /**
   * Returns a new HTML element matching the tag.
   * @param {string} tagName - HTML tag name.
   * @returns {object} - new HTML element matching the tag.
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }

})();