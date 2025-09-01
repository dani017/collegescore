/*
 * College Inclusiveness Search Team
 * February 2025
 */
// Next TODO: 
// Comment functions
// Start connecting it to real databases
// change the filters thing shsoudl be based on ratings rather than filter list (or functions to convert one into the other)
// Remove hard coded value in CSS and add colors

"use strict";

const NO_COLLEGES_FOUND = "<li>No colleges match your criteria.</li>";

(async function() {
  window.addEventListener("load", init);

  let collegesOrig;
  let colleges;
  let currentIndexes = [0, 1, 2];
  let nameToRating = {};

  // Display the initial webpage
  async function init() {
    // Show custom alert modal
    const alertModal = document.getElementById("custom-alert");
    const closeBtn = document.getElementById("close-alert-btn");
    alertModal.classList.remove("hidden");
    closeBtn.focus();

    closeBtn.onclick = () => {
        alertModal.classList.add("hidden");
    };

    collegesOrig = getCollegesFromDatabase();
    colleges = await getCollegesFromDatabase2();

    // debug
    console.log(colleges);
    console.log(collegesOrig);

    //await displayInitialColleges();
    //setInterval(rotateColleges, 7000);
    qs("#search-bar input").addEventListener("input", showSuggestions);
    qs("#search-bar input").addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        filterColleges();
      }
    });
    qs("#search-bar .btn").addEventListener("click", filterColleges);
    id("clear-filters-btn").addEventListener("click", clearFilters);
    document.getElementById("selectState").addEventListener("change", filterColleges);
    qsa(".filter-option").forEach(checkbox => {
        checkbox.addEventListener("change", filterColleges);
      });

    }
;

  // function clearFilters() {
  //   qsa(".filter-option").forEach(checkbox => checkbox.checked = false);
  //   id("selectState").value = "None"; 
  //   //filterColleges();
  // }

  function clearFilters() {
    qsa(".filter-option").forEach(checkbox => checkbox.checked = false);
    id("selectState").value = "None"; 
    id("search").value = "";

    //displayInitialColleges(); 

    let resultsContainer = id("results");
    let statusMessage = id("search-status");

    resultsContainer.innerHTML = "";
    statusMessage.textContent = ""; 

}



  async function showSuggestions() {
    let query = this.value;
    let suggestions = await getRequest("/search/" + query, res => res.json());
    id("suggestions").innerHTML = "";
    for (let i = 0; i < suggestions.length; i++) {
      let option = gen("option");
      option.value = suggestions[i];
      id("suggestions").appendChild(option);
      option.setAttribute("role", "option");
      option.setAttribute("tabindex", "0");

    }

    suggestionsBox.classList.add("hidden");
  }

  // Filter collges to display based on filters selected, state selected or name of the university searched for
  async function filterColleges() {
    let searchQuery = id("search").value.toLowerCase().trim();
    let selectedFilters = Array.from(document.querySelectorAll(".filter-option:checked"))
        .map(cb => cb.value);
    let selectedState = document.getElementById("selectState").value;

    // If nothing is searched, no filters are checked, and state is "None", clear results/status
    if (!searchQuery && selectedFilters.length === 0 && selectedState === "None") {
        clearFilters();
        return;
    }

    // Determine if sorting by rating is requested
    let sortBy = null;
    let endpoint = null;
    if (selectedFilters.includes("accessibility")) {
        sortBy = "access";
        endpoint = "/top-access";
    } else if (selectedFilters.includes("safety")) {
        sortBy = "safety";
        endpoint = "/top-safety";
    } else if (selectedFilters.includes("inclusivity")) {
        sortBy = "inclusion";
        endpoint = "/top-inclusion";
    }

    // If a sort filter is checked, fetch from backend and display
    if (endpoint) {
        let topColleges = await getRequest(endpoint, res => res.json());
        topColleges.forEach(row => console.log("Row from backend:", row)); // Add this line
        // Optionally filter by state or search query
        if (selectedState !== "None") {
            topColleges = topColleges.filter(college =>
                college.location && college.location.trim().toLowerCase() === selectedState.trim().toLowerCase()
            );
        }
        if (searchQuery) {
            topColleges = topColleges.filter(college =>
                college.college_name.toLowerCase().includes(searchQuery)
            );
        }
        updateResults(topColleges.map(row => ({
            name: row.college_name,
            access_avg: round(row.access_avg),
            inclusion_avg: round(row.inclusion_avg),
            safety_avg: round(row.safety_avg),
            // Add location and accommodations if needed
            location: row.location || "",
            //accommodations: row.accommodations ? JSON.parse(row.accommodations) : []
        })));
        return;
    }

    // Remove the sort filters from selectedFilters so they don't act as accommodations filters
    selectedFilters = selectedFilters.filter(f => !["safety", "inclusivity", "accessibility"].includes(f));

    let filteredColleges = colleges.filter(college => {
        let matchesSearch = searchQuery ? college.name.toLowerCase().includes(searchQuery) : true;
        let stateMatches = selectedState === "None" ? true : college.location.trim().toLowerCase() === selectedState.trim().toLowerCase();
        let matchesFilters = selectedFilters.length === 0 || selectedFilters.every(filter => college.accommodations.includes(filter));
        return matchesSearch && matchesFilters && stateMatches;
    });

    updateResults(filteredColleges);
}

  // Display the colleges that match the filtering
  async function updateResults(filteredColleges) {
    let resultsContainer = id("results");
    let statusMessage = id("search-status");

    resultsContainer.innerHTML = "";

    if (filteredColleges.length > 100) {
        filteredColleges = filteredColleges.slice(0, 100);
    }

    if (filteredColleges.length > 0) {
        // Process all colleges in parallel using Promise.all
        const collegePromises = filteredColleges.map(async (college) => {
            let card = document.createElement("div");
            card.classList.add("college-card2");

            // Use provided averages if present, otherwise fetch
            let ratingAvgs;
            if (
                college.access_avg !== undefined ||
                college.inclusion_avg !== undefined ||
                college.safety_avg !== undefined
            ) {
                ratingAvgs = {
                    access_avg: college.access_avg,
                    inclusion_avg: college.inclusion_avg,
                    safety_avg: college.safety_avg
                };
            } else {
                // fallback: fetch if not present
                let name = college.name || college.college_name;
                if (!nameToRating[name]) {
                    console.log("Fetching ratings for:", name);
                    try {
                        nameToRating[name] = await getRequest("/access-avgs/" + name, res => res.json());
                        ratingAvgs = nameToRating[name];
                        // Round the values
                        for (const [key, value] of Object.entries(ratingAvgs)) {
                            if (ratingAvgs[key] !== null && ratingAvgs[key] !== undefined) {
                                ratingAvgs[key] = round(value);
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching ratings for", name, ":", error);
                        // Set default values if fetch fails
                        ratingAvgs = {
                            access_avg: null,
                            inclusion_avg: null,
                            safety_avg: null
                        };
                        nameToRating[name] = ratingAvgs;
                    }
                } else {
                    ratingAvgs = nameToRating[name];
                }
            }

            card.innerHTML = `
                <h3>${college.name || college.college_name}</h3>
                <p><strong>Accessibility Rating:</strong> ${ratingAvgs["access_avg"] != null ? ratingAvgs["access_avg"] : "N/A"} out of 5</p>
                <p><strong>Inclusivity Rating:</strong> ${ratingAvgs["inclusion_avg"] != null ? ratingAvgs["inclusion_avg"] : "N/A"} out of 5</p>
                <p><strong>Safety Rating:</strong> ${ratingAvgs["safety_avg"] != null ? ratingAvgs["safety_avg"] : "N/A"} out of 5</p>
                <p><strong>Location:</strong> ${college.location || ""}</p>
            `;
            
            card.addEventListener("click", () => {
                window.location.href = 'college.html?name=' + encodeURIComponent(college.name || college.college_name);
            });
            card.setAttribute("role", "button");
            card.setAttribute("tabindex", "0");
            card.addEventListener("keypress", (event) => {
                if (event.key === "Enter") {
                    window.location.href = 'college.html?name=' + encodeURIComponent(college.name || college.college_name);
                }
            });

            return card;
        });

        // Wait for all cards to be processed
        const cards = await Promise.all(collegePromises);
        
        // Append all cards to the results container
        cards.forEach(card => {
            resultsContainer.appendChild(card);
        });

        statusMessage.textContent = `${filteredColleges.length} results found.`;
    } else {
        resultsContainer.innerHTML = NO_COLLEGES_FOUND;
        statusMessage.textContent = "No results found.";
    }

    resultsContainer.classList.remove("hidden");
    statusMessage.classList.add("hidden");
}



  // Display the initial cplleges on the carousel, making sure it's the three universities we have data for
  async function displayInitialColleges() {
    // Filter colleges to only those with "university" in the name (case-insensitive)
    let universityColleges = colleges.filter(college =>
      college.name.toLowerCase().includes("university")
    );

    // Pick 5 random from the filtered list
    let shuffled = universityColleges.slice().sort(() => 0.5 - Math.random());
    let randomColleges = shuffled.slice(0, 5);

    let resultsContainer = id("results");
    resultsContainer.innerHTML = "";

    for (let college of randomColleges) {
      let card = document.createElement("div");
      card.classList.add("college-card2");

      let ratingAvgs = nameToRating[college.name];
      if (!ratingAvgs) {
        nameToRating[college.name] = await getRequest("/rating-avgs/" + college.name, res => res.json());
        ratingAvgs = nameToRating[college.name];
        for (const [key, value] of Object.entries(ratingAvgs)) {
          ratingAvgs[key] = round(ratingAvgs[key]);
        }
      }
      card.innerHTML = `
        <h3>${college.name}</h3>
        <p><strong>Accessibility Rating:</strong> ${ratingAvgs["overallAccess_avg"] ? ratingAvgs["overallAccess_avg"] : "N/A"} out of 5</p>
        <p><strong>Inclusivity Rating:</strong> ${ratingAvgs["overallIdentity_avg"] ? ratingAvgs["overallIdentity_avg"] : "N/A"} out of 5</p>
        <p><strong>Location:</strong> ${college.location}</p>
        <p><strong>Accommodations:</strong> 
          ${Array.isArray(college.accommodations) && college.accommodations.length > 0 
              ? college.accommodations.join(", ") 
              : "N/A"}
        </p>
      `;
      resultsContainer.appendChild(card);
      card.addEventListener("click", () => {
        window.location.href = 'college.html?name=' + college.name;
      });
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
          window.location.href = 'college.html?name=' + college.name;
        }
      });
    }
    id("search-status").textContent = `${randomColleges.length} random universities shown.`;
}


  // round to exactly 1 decimal place
  // if 0 return "N/A"
  function round(num) {
    if (num === null || num === undefined || isNaN(num)) return null;
    num = (Math.round(num * 100) / 100).toFixed(1);
    return Number(num);
}

  // TO DO: get the full list pf colleges on the database
  function getCollegesFromDatabase() {
    const colleges = [
      { name: "university A", accommodations: ["Accessible Campus", "Queer-friendly"], location: "CA"},
      { name: "university B", accommodations: ["Sign Language Interpreter"], location: "CA" },
      { name: "university C", accommodations: ["Accessible Campus", "Sign Language Interpreter"], location: "WA" }, 
      { name: "university D", accommodations: ["Accessible Campus", "Queer-friendly"], location:"OR" },
      { name: "university E", accommodations: ["Sign Language Interpreter"], location:"WA" },
      { name: "university F", accommodations: ["Accessible Campus", "Sign Language Interpreter"], location: "WA" }
    ];
    return colleges; 
  }

  async function getCollegesFromDatabase2() {
    try {
        let res = await fetch("/colleges");
        await statusCheck(res);
        res = await res.json();

        for (let i = 0; i < res.length; i++) {
            res[i]["accommodations"] = JSON.parse(res[i]["accommodations"]);
            try {
                res[i]["resources"] = JSON.parse(res[i]["resources"]);
            } catch (e) {
                console.warn("Malformed JSON in resources:", res[i]["resources"]);
                res[i]["resources"] = [];
            }
        }

        return res;
    } catch (err) {
        console.error("Error fetching colleges:", err);
        return [];
    }
}



  function id(name) {
    return document.getElementById(name);
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
   * returns result of GET request with extractFunc being
   * either res => res.json() or res => res.text()
   * @param {string} url - URL to fetch
   * @param {function} extractFunc - res => res.json() or res => res.text()
   * @returns {object | string | undefined} - res.json(), res.text(), or undefined
   */
  async function getRequest(url, extractFunc) {
    try {
      let res = await fetch(url);
      await statusCheck(res);
      res = await extractFunc(res);
      return res;
    } catch (err) {
      handleError();
    }
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
        body: body
      });
      await statusCheck(res);
      res = await extractFunc(res);
      return res;
    } catch (err) {
      handleError();
    }
  }

  /**
   * Handles errors gracefully
   */
  function handleError() {
  }

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