// 1. Calculate the day number of the year
var now = new Date();
var start = new Date(now.getFullYear(), 0, 0);
var diff = now - start + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
var oneDay = 1000 * 60 * 60 * 24;
var dayNumber = Math.floor(diff / oneDay); // Gets the correct day number

// 2. Import Libraries
import { loveDB } from "./love.js";
import { sha256 } from "./sha256.js";

// 3. Update the day number dynamically
let day = document.getElementById("day2");
day.innerHTML = dayNumber; // Use the actual calculated day number

// 4. Fetch the phrase dynamically from loveDB
let phraseIndex = (dayNumber - 1) % loveDB.length; // Prevent out-of-range errors
let phrase0 = loveDB[phraseIndex]; // Get the phrase based on day number | phraseIndex

// Update the loveDB element with the selected phrase
let lovedb = document.getElementById("lovedb");
lovedb.innerHTML = phrase0;

// 5. Compute and display the SHA-256 hash
sha256(phrase0).then(function (digest) {
    console.log(digest);
    let hash = document.getElementById("hash2");
    hash.innerHTML = digest;
}).catch(function (error) {
    console.error("Error computing SHA-256 hash:", error);
});