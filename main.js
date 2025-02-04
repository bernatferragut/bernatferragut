
/*  
->project: /Users/kidscodejeunesse/Documents/ART/COLOR HASH/Project-hash-colors/
->domain: hashed-poems.surge.sh
*/
//1.knowing the day number of the year
var now = new Date();
var start = new Date(now.getFullYear(), 0, 0);
var diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
var oneDay = 1000 * 60 * 60 * 24;
var dayNumber = Math.floor(diff / oneDay);

// 2.Libraries imports
import { loveDB } from "./dist/love.js";
// console.log(loveDB[1].love);
let phrase0 = loveDB[83];

// 3.Bring year number to life
let day = document.getElementById('day2');
day.innerHTML = 84;

// 4.Bring loveDB to life
let lovedb = document.getElementById('lovedb');
lovedb.innerHTML = phrase0;

// 5.Hash - Sha256
import { sha256, hex } from './dist/sha256.js'

var hashNumber;
sha256(phrase0).then(function (digest) {
    console.log(digest)
    // Bring hash number to life
    let hash = document.getElementById('hash2');
    hash.innerHTML = digest;
});