const toggler = document.querySelector('.nav > .nav__toggler'),
  navListContainer = document.querySelector('.nav > .nav__wrapper');

/*when toggler button is clicked*/
toggler.addEventListener(
  "click",
  () => {
    //convert hamburger to close
    toggler.classList.toggle('nav__cross');
    //make nav visible
    navListContainer.classList.toggle('nav__active');
  },
  true
);