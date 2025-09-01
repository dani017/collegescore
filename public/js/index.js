/*
 * College Inclusiveness Search Team
 * February 2025
 */

"use strict";

import { getRequest } from './api.js';

(function() {
  window.addEventListener("load", init);

  /**
   * Sets up event listeners for the buttons.
   */
  function init() {
    // todo: initialize event listeners
    qs("#search-bar .btn").addEventListener("click", searchCollege);
    qs("#search-bar input").addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        searchCollege();
      }
    });
    qs("#search-bar input").addEventListener("input", showSuggestions);
  }

  /**
   * Searches a college based on user input
   */
  function searchCollege() {
    let college = qs("input").value;
    // alert("You searched for " + college);
    window.location.href = `filter.html?name=${college}`;
  }

  /* --- HELPER FUNCTIONS --- */

  /**
   * Shows search suggestions based on input
   */
  async function showSuggestions() {
    let query = this.value;
    let suggestions = await getRequest("/search/" + query, res => res.json());
    // console.log(suggestions);
    id("suggestions").innerHTML = "";
    for (let i = 0; i < suggestions.length; i++) {
      let option = gen("option");
      option.value = suggestions[i];
      id("suggestions").appendChild(option);
      option.setAttribute("role", "option");
      option.setAttribute("tabindex", "0");
    }
  }

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