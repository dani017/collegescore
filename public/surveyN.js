/**Structure
 * Render and DOM functions (renderQs and update progress)
 * Logic/flow control (what questions to show and moving to next)
 * Event Handling
 * Posts
 * Helpers
 * Questions & Responces
 */

document.addEventListener("DOMContentLoaded", initSurvey);

/**DOM render and event handling*/
function initSurvey() {
    //HTMl elments
    const surveyContainer = document.getElementById("survey-container");
    const submitBtn = document.getElementById("submitBtn");
    const collegeHeader = document.getElementById("college-header");
    const backBtn =  document.getElementById("backBtn");
    
    /*Rendering*/
    //Top of page functionality 
    const urlParams = new URLSearchParams(window.location.search);
    collegeName = urlParams.get("name");
    collegeHeader.textContent = `${collegeName} Review` ; //displays what college review is for
    
    //Render visable questions
    const visibleQuestions = questions.filter(q => showQuestion(q));
    visibleQuestions.forEach(q => {
  const elemQ = renderQuestion(q);
  const question = document.createElement("div");//Question wrapper for styling
  question.className = "question";
  // If this is a conditional question, hide the wrapper by default
  if (q.conditional) {
    question.style.display = "none";
    elemQ.style.display = "block"; // ensure inner fieldset is block
    question.id = `${q.id}-wrapper`; // give it an id for toggling
  }
  question.appendChild(elemQ);
  surveyContainer.insertBefore(question, submitBtn);
});

    // Handle conditional question display
    setupConditionalQuestions();
    
    // Add years validation
    setupYearsValidation();

    stars();//accessibile stars function

    /*Event Listeners*/
    backBtn.addEventListener("click", function(){//close window, return to college page on back
      window.close();
    });

    //Submit survey when submit button is pressed
    surveyContainer.addEventListener("submit", function(event){
      event.preventDefault();
      submitSurvey(surveyContainer,collegeName);
    });

    document.addEventListener("keydown", function(e) {
        const active = document.activeElement;
        if (
        (e.key === "Enter" || e.key === " ") &&
        active &&
        active.tagName === "INPUT" &&
        active.type === "radio"
        ) {
        e.preventDefault();
        //active.checked = true;
        }
    });
};

/*Logic*/
/** Determines what types of questions are displayed to the user
 * @param {*} q object to identify questions category
 * @returns true if a question can be displayed to the user, false if it cannot
 * lgbt and poc commented out while on accessability only
 */
function showQuestion(q/*, responses*/) {
 // Always show general, identity, and attendance questions
  if (!q.category || q.category === "general" || q.category === "identity" || q.category === "attendance") {
    // Handle conditional questions
    if (q.conditional) {
      // Always render conditional questions so they can be shown/hidden dynamically
      return true;
    }
    return true;
  }
  // Show LGBTQIA2+ questions only if they identified as such
  //if (q.category === "lgbt" && responses.lgbt_id === "yes") return true;

  // Show POC questions only if they identified as such
  //if (q.category === "poc" && responses.poc_id === "yes") return true;

  // Show disability questions only if they identified as such
  if (q.category === "disability" /*&& responses.disability_id === "yes"*/) return true;
  
  // Otherwise, don't show
  return false;
}

//if disablity_id = "yes" (answers[2]="yes") then show the questions
/**Use question to populate html * 
 * @param {*} q to get type to populate correct question template with id and text
 * @returns returns an html element of the question 
 */
function renderQuestion(q){
    if (q.type === "written") return writtenRespQ(q.id, q.text);
    if (q.type === "yesno") return ynRespQ(q.id, q.text);
    if (q.type === "rating") return ratingRespQ(q.id, q.text);
    if (q.type === "years") return yearsRespQ(q.id, q.text); 
}


 /**POST form data to database and close survey*/
function submitSurvey(surveyContainer, collegeName){
    let formData = new FormData(surveyContainer);
    let jsonData = {};
    jsonData["college_name"] = collegeName;

    formData.forEach((value, key) => {
      if (value.trim() === "") {
          jsonData[key] = null;  // handle unasnwered fields
      } else if (!isNaN(value)) {
          jsonData[key] = parseInt(value, 10); //convert star ratings to integers (base 10)
      } else {
          jsonData[key] = value;
      }
    });
    postRequest(`/submit-response/${encodeURIComponent(collegeName)}`, JSON.stringify(jsonData), res => res.text());
    window.open(`/college.html?name=${encodeURIComponent(collegeName)}`); //returns to college page where review was left
}

  /**Functionality for star ratings */
function stars() {
  const starRatings = document.querySelectorAll(".star-rating");

  starRatings.forEach(rating => { //for each rating question
    const stars = rating.querySelectorAll("label");
    const inputs = rating.querySelectorAll("input");

    //sets up event listening and functionality for each star in a question instance
        //this loop only runs on page load
        //event listeners inside the loop are running repeatedly
    stars.forEach((star, index) => {
      const input = star.previousElementSibling;

      // Mouse events
      star.addEventListener("mouseover", () => highlightStars(index));
      star.addEventListener("mouseout", resetStars);
      star.addEventListener("click", () => {
        input.checked = true;
        highlightStars(index);
      });

      // Keyboard events
      input.addEventListener("focus", () => highlightStars(index));
      input.addEventListener("blur", resetStars);

      input.addEventListener("keydown", (e) => {
        const total = inputs.length;//number of stars in the question block

        if (e.key === "ArrowRight" || e.key === "Right") {//rating+1
          e.preventDefault();
          const next = (index + 1) % total;
          inputs[next].focus();//triggers focus event listern on the new star (in same group)
        } else if (e.key === "ArrowLeft" || e.key === "Left") {//rating-1
          e.preventDefault();
          const prev = (index - 1 + total) % total;
          inputs[prev].focus();//triggers focus event listern on the new star (in same group)
        } else if (e.key === " " || e.key === "Enter") { //allow select with space and enter
          e.preventDefault();
          input.checked = true;
          highlightStars(index);
        }
      });
    });

    //Highlights each star up to and including the current (hovered/focused) star
    function highlightStars(index) {
      stars.forEach((star, i) => {
        star.style.color = i <= index ? "rgb(219, 164, 0)" : "#ccc";
      });
    }

    //Unhighlights stars that are not currently hovered/focused up to
    function resetStars() {
      stars.forEach((star, i) => {
        const checked = rating.querySelector("input:checked");
        if (checked) {
          const checkedIndex = Array.from(inputs).indexOf(checked);
          star.style.color = i <= checkedIndex ? "rgb(219, 164, 0)" : "#ccc";
        } else {
          star.style.color = "#ccc";
        }
      });
    }
    });
}

//Helper functions for conditional questions and validation:
function setupConditionalQuestions() {
    const collegeAttendedInputs = document.querySelectorAll('input[name="college_attended"]');
    const yearsWrapper = document.getElementById('attendance_years-wrapper');
    const yearsContainer = document.getElementById('attendance_years-container');
    
    collegeAttendedInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.value === 'yes' && this.checked) {
                yearsWrapper.style.display = 'block';
                document.getElementById('attendance_years_start').required = true;
                document.getElementById('attendance_years_end').required = true;
            } else if (this.value === 'no' && this.checked) {
                yearsWrapper.style.display = 'none';
                document.getElementById('attendance_years_start').value = '';
                document.getElementById('attendance_years_end').value = '';
                document.getElementById('attendance_years_start').required = false;
                document.getElementById('attendance_years_end').required = false;
                document.getElementById('attendance_years_error').style.display = 'none';
            }
        });
    });
}

function setupYearsValidation() {
    const startYearInput = document.getElementById('attendance_years_start');
    const endYearInput = document.getElementById('attendance_years_end');
    const errorDiv = document.getElementById('attendance_years_error');
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear + 4;

    function validateYears() {
        const startYear = parseInt(startYearInput.value);
        const endYear = parseInt(endYearInput.value);

        if (startYearInput.required && endYearInput.required) {
            if (!startYear || !endYear) {
                errorDiv.textContent = 'Please enter both start and end years';
                errorDiv.style.display = 'block';
                return false;
            }

            if (startYear > endYear) {
                errorDiv.textContent = 'Start year must be before or equal to end year';
                errorDiv.style.display = 'block';
                return false;
            }

            if (startYear < 1950 || endYear > maxYear) {
                errorDiv.textContent = `Please enter years between 1950 and ${maxYear}`;
                errorDiv.style.display = 'block';
                return false;
            }
        }

        errorDiv.style.display = 'none';
        return true;
    }

    if (startYearInput && endYearInput) {
        startYearInput.addEventListener('input', validateYears);
        endYearInput.addEventListener('input', validateYears);
    }
}



/*Questions Formatting*/

/**HTML for questions that require a written response.
 * @param {String} id for the html element that relates to the DB name
 * @param {String} questionText 
 * @returns html for the question with a text area for response 
 */
function writtenRespQ(id, questionText){
    const container = document.createElement("div");
    container.className = "text-question";
    container.innerHTML = `
        <label for="${id}">${questionText}</label>
        <textarea id="${id}" name="${id}" rows="6" cols="33"></textarea>
    `;
    return container;
}

//todo: consider changing so input is inside the label 
//todo:update if should be fieldset
/**HTML for accessible likart scale questions 
 * @param {String} id for the html element that relates to the DB name
 * @param {String} questionText 
 * @returns html for the question with a 1-5 star response options
*/
function ratingRespQ(id, questionText){
    const container = document.createElement("fieldset");
    container.className = "star-rating";
    container.innerHTML = `
        <legend>${questionText}</legend>
        <div>
          <input type="radio" name="${id}" value="1" id="${id}1" aria-label="1 star"/>
          <label for="${id}1" >★</label>
          <input type="radio" name="${id}" value="2" id="${id}2" aria-label="2 stars"/>
          <label for="${id}2">★</label>
          <input type="radio" name="${id}" value="3" id="${id}3" aria-label="3 stars"/>
          <label for="${id}3">★</label>
          <input type="radio" name="${id}" value="4" id="${id}4" aria-label="4 stars"/>
          <label for="${id}4">★</label>
          <input type="radio" name="${id}" value="5" id="${id}5" aria-label="5 stars"/>
          <label for="${id}5">★</label>
        </div>
    `;
    return container;
}

/**HTML for yes/no questions 
 * @param {String} id for the html element that relates to the DB name
 * @param {String} questionText 
 * @returns html for the question with yes no response options
*/
function ynRespQ(id, questionText){
    const container = document.createElement("fieldset");
    container.className = "yesno-question"
    container.innerHTML = `
        <legend id="${id}">${questionText}</legend>
        <label><input type="radio" name="${id}" value="yes" required> Yes</label>
        <label><input type="radio" name="${id}" value="no" required> No</label>
    ` ;  
    return container;
}

/**HTML for attendance question
 * @param {String} id for the html element that relates to the DB name
 * @param {String} questionText 
 * @returns html for the question with years response options
*/
function yearsRespQ(id, questionText){
    const container = document.createElement("fieldset");
    container.className = "years-question";
    container.id = `${id}-container`;
    container.style.display = "none"; // Initially hidden

    const currentYear = new Date().getFullYear();
    const maxYear = currentYear + 4;

    container.innerHTML = `
        <legend>${questionText}</legend>
        <div class="years-input-group">
            <div class="input-field">
                <label for="${id}_start">From Year:</label>
                <input type="number" name="${id}_start" id="${id}_start" 
                       min="1950" max="${maxYear}" placeholder="e.g. ${currentYear - 4}">
            </div>
            <div class="input-field">
                <label for="${id}_end">To Year:</label>
                <input type="number" name="${id}_end" id="${id}_end" 
                       min="1950" max="${maxYear}" placeholder="e.g. ${maxYear-4}">
            </div>
        </div>
        <div class="error" id="${id}_error" style="display:none; color: #e53e3e; font-size: 0.9em; margin-top: 5px;">
            Please enter valid years (start year should be before or equal to end year)
        </div>
    `;
    return container;
}


//Survey Questions
//phase1: only general and accessability questions will be populated 
let collegeName;
//all possible survey quesitons
const questions = [
    // College Attendance Block (add at the top)
    {   type: "yesno", 
        id: "college_attended", 
        text: "Did you attend this college/university?",
        category: "attendance"},
    {   type: "years", 
        id: "attendance_years", 
        text: "What years did you attend? (From - To)",
        category: "attendance",
        conditional: "college_attended", // Only show if college_attended is "yes"
        conditionalValue: "yes"},
    //Identity Block
    {   type: "yesno", 
        id:"lgbt_id", 
        text: "Do you identify as LGBTQIA2+ ",
        category: "identity"},
    {   type: "yesno", 
        id: "poc_id", 
        text:"Do you identify as a person of color (POC)",
        category: "identity"},
    {   type: "yesno", 
        id: "disability_id", 
        text: "Have you used campus accessibility services (such as extended test time, note-taking assistance, accessible housing, etc.)?",
        category:"identity"},
    {   type: "yesno", 
        id: "optin", 
        text: "Show your demographic identities (POC, LGBTQ+, disabled, etc.) with this response? This allows others to filter responses by these categories.",
        category: "identity"},
    {   type: "written", 
        id: "share_id", 
        text: "If there any other details about your identity you would like included in your response, please list them below",
        category:"identity"},
        
    //LGBT Block
    
    //POC block
    
    //Disability block
    {   type: "rating", 
        id: "disability_safety", 
        text: "On a scale of 1-5 how safe do you feel on campus and the surrounding area as a person with a disability?"
            + "\n1 being not safe at all, 5 being incredibly safe." ,
        category:"disability"},
    {   type: "rating", 
        id: "disability_inclusion", 
        text: "On a scale of 1-5 how inclusive to disability identities is your school (peers and staff)?"
            + "\n1 being not at all, 5 being very inclusive." ,
        category:"disability"},
    {   type: "rating", 
        id: "disability_bias", 
        text: "On a scale of 1-5 how rarely do you hear ableist/derogatory language from students and staff?"
            + "\n1 being frequent, 5 being never." ,
        category:"disability"},
    {   type: "rating", 
        id: "disability_access", 
        text: "On a scale of 1-5 how accessible is your campus?"
            + "\n1 being not accessible, 5 being highly accessible." ,
        category:"disability"},
    {   type: "rating", 
        id: "disability_peer", 
        text: "On a scale of 1–5, how easy is it for students to find and participate in disability communities and spaces on or near campus?"
            + "\n1 being not accessible at all, 5 being very accessible and welcoming." ,
        category:"disability"},
    {   type: "rating", 
        id: "disability_inst", 
        text: "On a scale of 1-5 how reliable are your accommodations? Are your accommodation needs being met? "
            + "\n1 being very unreliable/not actually provided to you, 5 being very reliable in practice." ,
        category:"disability"},
    {   type: "written", 
        id: "disability_accom", 
        text: "If you are comfortable with having this information included in your public response please share what accommodations you use and what your experience getting those accommodations met has been.",
        category:"disability"},
    //General Block
    {   type: "written", 
        id: "written_rev", 
        text: "If you would like to, please share a short review of your experience in your college.",
        category:"general"},
    {   type: "written", 
        id: "written_exp", 
        text: "Did you feel welcome and supported? Please share how your identity has shaped your experience at this school.",
        category:"general"},
    {   type: "written", 
        id: "written_challenges", 
        text: "Have you faced or witnessed any challenges related to your identity, particularly as part of one or more underrepresented groups?",
        category:"general"},
    {   type: "written", 
        id: "written_recs", 
        text: "Were there any community groups or classes you would like to share with prospective students? Please list them.",
        category:"general"},
];

/*-----------HELPER FUNCTIONS-----------*/

 /**
   * If res does not have an ok HTML response code, throws an error.
   * Returns the argument res.
   * @param {object} res - HTML result
   * @returns {object} -  same res passed in
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * returns result of POST request with extractFunc being
   * either res => res.json() or res => res.text()
   * @param {string} url - URL to fetch
   * @param {object} body - body of POST request
   * @param {function} extractFunc - res => res.json() or res => res.text()
   * @returns {object | string | undefined} - res.json(), res.text(), or undefined
   */
  async function postRequest(url, body, extractFunc) {
    try {
      let res = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: body
      });
      await statusCheck(res);
      res = await extractFunc(res);
      console.log("Post response: ", res);
      return res;
    } catch (err) {
      console.error("Post error:" ,err);
    }
  }
