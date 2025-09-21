let loadScreen = document.querySelector("#load-screen");
let startBtn = document.querySelector("#start-btn");
let titleBar = document.querySelector("#title-bar");
let homeScreen = document.querySelector("#home-screen");
let plantScreen = document.querySelector("#plant-screen");
let allPlantBtn = document.querySelector("#all-plants-btn");
let plantAmountOverlay = document.querySelector("#plant-number-overlay");
let gridBtn = document.querySelector("#grid-btn");
let plantGridBtn = document.querySelector("#plant-grid-btn");
let plantCard = document.querySelectorAll(".plant-card")
let plantInfoScreen = document.querySelector("#plant-info")

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
    allPlantBtn.addEventListener('click', () => {
        homeScreen.style.opacity = '0';
        setTimeout(() => {
            homeScreen.style.display = 'none';
            plantScreen.style.display = 'grid';
            setTimeout(() => {
                plantScreen.style.opacity = '1';
            }, 15);
        }, 300);
    })
    plantAmountOverlay.addEventListener('click', () => {
        homeScreen.style.opacity = '0';
        setTimeout(() => {
            homeScreen.style.display = 'none';
            plantScreen.style.display = 'grid';
            setTimeout(() => {
                plantScreen.style.opacity = '1';
            }, 15);
        }, 300);
    })
    gridBtn.addEventListener('click', () => {
        plantScreen.style.opacity = '0';
        setTimeout(() => {
            plantScreen.style.display = 'none';
            homeScreen.style.display = 'grid';
            titleBar.style.display = 'grid';
            setTimeout(() => {
                homeScreen.style.opacity = '1';
                titleBar.style.opacity = '1';
            }, 15);
        }, 300);
    });
    plantGridBtn.addEventListener('click', () => {
        plantInfoScreen.style.opacity = '0';
        setTimeout(() => {
            plantInfoScreen.style.display = 'none';
            homeScreen.style.display = 'grid';
            titleBar.style.display = 'grid';
            setTimeout(() => {
                homeScreen.style.opacity = '1';
                titleBar.style.opacity = '1';
            }, 15);
        }, 300);
    });

    var elements = document.getElementsByClassName("plant-card");

    var eachPlantPage = function() {
        plantScreen.style.opacity = '0';
        homeScreen.style.opacity = '0';
        titleBar.style.opacity = '0';
        setTimeout(() => {
            plantScreen.style.display = 'none';
            homeScreen.style.display = 'none';
            titleBar.style.display = 'none';
            plantInfoScreen.style.display = 'grid';
            setTimeout(() => {
                plantInfoScreen.style.opacity = '1';
            }, 15);
        }, 300);
    };

    for (var i = 0; i < elements.length; i++) {
        elements[i].addEventListener('click', eachPlantPage, false);
    }

    // document.body.addEventListener('click', function (evt) {
    // if (evt.target.className === 'plant-card') {
    //     plantScreen.style.opacity = '0';
    //     homeScreen.style.opacity = '0';
    //     titleBar.style.opacity = '0';
    //     setTimeout(() => {
    //         plantScreen.style.display = 'none';
    //         homeScreen.style.display = 'none';
    //         titleBar.style.display = 'none';
    //         plantInfoScreen.style.display = 'grid';
    //         setTimeout(() => {
    //             plantInfoScreen.style.opacity = '1';
    //         }, 15);
    //     }, 300);
    // }
    // }, false);
});