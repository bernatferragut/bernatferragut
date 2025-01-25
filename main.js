// Safely handle hamburger menu if it exists
const hamburgerMenu = document.querySelector('.hamburger-menu');
const menuLinks = document.querySelector('.menu-links');

if (hamburgerMenu && menuLinks) {
  hamburgerMenu.addEventListener('click', function() {
    menuLinks.classList.toggle('active');
  });
}