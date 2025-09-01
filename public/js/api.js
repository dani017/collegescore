/**
 * Makes a GET request and returns the extracted result.
 * @param {string} url - URL to fetch
 * @param {function} extractFunc - res => res.json() or res => res.text()
 * @returns {object | string | undefined}
 */
export async function getRequest(url, extractFunc) {
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
 * Makes a POST request and returns the extracted result.
 * @param {string} url - URL to fetch
 * @param {object} body - body of POST request
 * @param {function} extractFunc - res => res.json() or res => res.text()
 * @returns {object | string | undefined}
 */
export async function postRequest(url, body, extractFunc) {
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
 * Checks response status and throws error if not ok.
 * @param {object} res - HTML result
 * @returns {object}
 */
export async function statusCheck(res) {
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res;
}

/**
 * Handles errors gracefully (customize as needed).
 */
export function handleError() {
  // Implement error handling logic here
}

/**
 * Fetches all colleges from the backend.
 * @returns {Promise<Array>} - Array of college objects
 */
export async function getCollegesFromDatabase2() {
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

/**
 * Fetches search suggestions for a query.
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of college name suggestions
 */
export async function getCollegeSuggestions(query) {
  return getRequest("/search/" + query, res => res.json());
}

/**
 * Fetches rating averages for a college.
 * @param {string} collegeName
 * @returns {Promise<Object>} - Object with access_avg, inclusion_avg, safety_avg
 */
export async function getCollegeRatings(collegeName) {
  return getRequest("/access-avgs/" + collegeName, res => res.json());
}

/**
 * Fetches top colleges by a given endpoint.
 * @param {string} endpoint - "/top-access", "/top-inclusion", or "/top-safety"
 * @returns {Promise<Array>} - Array of college objects
 */
export async function getTopColleges(endpoint) {
  return getRequest(endpoint, res => res.json());
}

/**
 * Fetches college details by name.
 * @param {string} collegeName
 * @returns {Promise<Object>} - College details
 */
export async function getCollegeDetails(collegeName) {
  return getRequest("/colleges/" + collegeName, res => res.json());
}

/**
 * Fetches overall rating averages for a college.
 * @param {string} collegeName
 * @returns {Promise<Object>} - Object with overall_avg, accessibility_avg, etc.
 */
export async function getCollegeRatingAverages(collegeName) {
  return getRequest("/resp-rating-avgs/" + collegeName, res => res.json());
}

/**
 * Fetches all individual responses for a college.
 * @param {string} collegeName
 * @returns {Promise<Array>} - Array of response objects
 */
export async function getAllResponses(collegeName) {
  return getRequest("/all-responses/" + collegeName, res => res.json());
}

/**
 * Fetches statistics for a college.
 * @param {string} collegeName
 * @returns {Promise<Object>} - Object with percent data
 */
export async function getCollegeStats(collegeName) {
  return getRequest("/stats/" + collegeName, res => res.json());
}

/**
 * Submits a survey response for a college.
 * @param {string} collegeName
 * @param {object} jsonData - Survey data
 * @returns {Promise<string>} - Response text
 */
export async function submitSurveyResponse(collegeName, jsonData) {
  return postRequest(
    `/submit-response/${encodeURIComponent(collegeName)}`,
    JSON.stringify(jsonData),
    res => res.text()
  );
}