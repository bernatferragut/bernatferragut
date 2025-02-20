// 1. Calculate the day number of the year
const now = new Date();
const start = new Date(now.getFullYear(), 0, 0);
const diff = now - start + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
const oneDay = 1000 * 60 * 60 * 24;
let dayNumber = Math.floor(diff / oneDay);
dayNumber = Math.max(1, Math.min(dayNumber, 366)); // Clamp to valid range 1-366

// 2. Import Libraries
import { loveDB } from "./love.js";
import { sha256 } from "./sha256.js";

// 3. Update the day number dynamically
let day = document.getElementById("day2");
day.innerHTML = dayNumber; // Use the actual calculated day number

/**
 * Updates the displayed poem and its SHA-256 hash
 * @param {number} dayNumber - The current day number (1-366)
 * @returns {void}
 */
function updatePoemAndHash(dayNumber) {
    let phraseIndex = (dayNumber - 1) % loveDB.length; // Prevent out-of-range errors
    let phrase0 = loveDB[phraseIndex]; // Get the phrase based on day number

    // Update the loveDB element with the selected phrase
    let lovedb = document.getElementById("lovedb");
    lovedb.innerHTML = phrase0;

    // Compute and display the SHA-256 hash
    sha256(phrase0).then(function (digest) {
        console.log(digest);
        let hash = document.getElementById("hash2");
        hash.innerHTML = digest;
    }).catch(function (error) {
        console.error("Error computing SHA-256 hash:", error);
        document.getElementById("hash2").textContent = "Error generating hash";
        document.getElementById("lovedb").textContent = "Unable to load daily text";
        document.getElementById("hash2").textContent = "Error generating hash";
        document.getElementById("lovedb").textContent = "Unable to load daily text";
    });
}

// Initial update
updatePoemAndHash(dayNumber);

// Event listeners for the buttons
document.getElementById("prevDay").addEventListener("click", function() {
    dayNumber = (dayNumber - 1 + 366) % 366 || 366; // Decrement day number, wrap around if necessary
    day.innerHTML = dayNumber;
    updatePoemAndHash(dayNumber);
});

document.getElementById("nextDay").addEventListener("click", function() {
    dayNumber = (dayNumber % 366) + 1; // Increment day number, wrap around if necessary
    day.innerHTML = dayNumber;
    updatePoemAndHash(dayNumber);
});