let loadScreen = document.querySelector("#load-screen");
let startBtn = document.querySelector("#start-btn");
let titleBar = document.querySelector("#title-bar");
let homeScreen = document.querySelector("#home-screen");

window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('logo-container').classList.add('logo-up');
    }, 2000);
    startBtn.addEventListener('click', () => {
        loadScreen.style.opacity = '0';
        setTimeout(() => {
            loadScreen.style.display = 'none';
            titleBar.style.display = 'grid';
            homeScreen.style.display = 'grid';
            setTimeout(() => {
                titleBar.style.opacity = '1';
                homeScreen.style.opacity = '1';
            }, 50);
        }, 800);
    });
        
});