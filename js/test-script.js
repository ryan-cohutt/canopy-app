let loadScreen = document.querySelector("#load-screen");
let startBtn = document.querySelector("#start-btn");
let titleBar = document.querySelector("#title-bar");
let homeScreen = document.querySelector("#home-screen");
let plantScreen = document.querySelector("#plant-screen");
let allPlantBtn = document.querySelector("#all-plants-btn");
let plantAmountOverlay = document.querySelector("#plant-number-overlay");
let gridBtn = document.querySelector("#grid-btn");
let plantGridBtn = document.querySelector("#plant-grid-btn");
let plantInfoScreen = document.querySelector("#plant-info");
let addPlantBtn = document.querySelector("#add-plants-btn");
let addPlantBtn2 = document.querySelector("#plant-screen-add-btn");
let addPlantCard = document.querySelector("#add-plant-card");
let addPlantImage = document.querySelector("#add-plant-image");
let addPlantInfo = document.querySelector("#add-plant-info");
let addPlantCloseBtn = document.querySelector("#add-plant-close-btn");
let plantCameraBtn = document.querySelector("#add-camera");
let plantPhotosBtn = document.querySelector("#add-photo");
let fileInput = document.querySelector("#fileInput");
let cameraInput = document.querySelector("#cameraInput");
let photoInput = document.querySelector("#photoInput");
let savePlant = document.querySelector("#plant-save-btn");

let savedPlants = JSON.parse(localStorage.getItem('savedPlants')) || [];
let currentPlant = {};

async function identifyPlant(base64Image) {
  const apiKey = "Nq40v3XjyfBITZVmd44xhOYuC6I8YYF8AvJGTsYXoP9h3lA48r"; 
  const apiUrl = "https://plant.id/api/v3/identification";

  const data = {
    images: [base64Image],
    similar_images: true,
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  return result;
}

function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

async function getCareInstructions(accessToken) {
  const apiKey = "Nq40v3XjyfBITZVmd44xhOYuC6I8YYF8AvJGTsYXoP9h3lA48r";
  const url = `https://plant.id/api/v3/identification/${accessToken}/conversation`;

  const summaryCareData = {
    question: "Provide a short 2-sentence care summary for this plant.",
    prompt: "Give answer in 2 sentences.",
    temperature: 0.5,
    app_name: "MyAppBot",
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": apiKey,
    },
    body: JSON.stringify(summaryCareData),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  const result = await response.json();

  if (result.messages && result.messages.length > 0) {
    return result.messages[result.messages.length - 1].content;
  } else {
    return "Care info unavailable.";
  }
}


window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("logo-container").classList.add("logo-up");
  }, 2000);

  startBtn.addEventListener("click", () => {
    loadScreen.style.opacity = "0";
    setTimeout(() => {
      loadScreen.style.display = "none";
      titleBar.style.display = "grid";
      homeScreen.style.display = "grid";
      setTimeout(() => {
        titleBar.style.opacity = "1";
        homeScreen.style.opacity = "1";
      }, 50);
    }, 800);
  });

  allPlantBtn.addEventListener("click", () => switchScreens(homeScreen, plantScreen));
  plantAmountOverlay.addEventListener("click", () => switchScreens(homeScreen, plantScreen));
  gridBtn.addEventListener("click", () => switchScreens(plantScreen, homeScreen));
  plantGridBtn.addEventListener("click", () => {titleBar.style.display = "grid"; switchScreens(plantInfoScreen, homeScreen)});

  function switchScreens(from, to) {
    from.style.opacity = "0";
    setTimeout(() => {
      from.style.display = "none";
      to.style.display = "grid";
      setTimeout(() => (to.style.opacity = "1"), 15);
    }, 300);
  }

  addPlantBtn.addEventListener("click", openAddPlant);
  addPlantBtn2.addEventListener("click", openAddPlant);
  function openAddPlant() {
    addPlantCard.style.display = "grid";
    setTimeout(() => {
        addPlantCard.style.opacity = "1";
        addPlantCard.style.bottom = "0";
        addPlantCard.style.top = 'auto';
    }, 300);
  }

  addPlantCloseBtn.addEventListener("click", () => {
    addPlantCard.style.opacity = "0";
    setTimeout(() => (addPlantCard.style.display = "none"), 300);
    addPlantInfo.style.display = "none";
    addPlantImage.style.display = "grid";
  });

plantCameraBtn.addEventListener("click", () => cameraInput.click());
plantPhotosBtn.addEventListener("click", () => photoInput.click());

function handleImageSelection(file) {
  convertImageToBase64(file).then(async (base64Image) => {
    try {
      const identificationResult = await identifyPlant(base64Image);

      if (
        identificationResult.result &&
        identificationResult.result.classification.suggestions.length > 0
      ) {
        const topSuggestion = identificationResult.result.classification.suggestions[0];
        const accessToken = identificationResult.access_token;

        let careSummary = "Care info unavailable.";

        try {
            const careResult = await getCareInstructions(accessToken);
            console.log("Care instructions fetched:", careResult);
            if (careResult) careSummary = careResult;
        } catch (err) {
          console.warn("Care instructions failed:", err);
        }

        currentPlant = {
          species: topSuggestion.name,
          careSummary,
          image: "data:image/jpeg;base64," + base64Image,
        };

        addPlantImage.style.display = "none";
        addPlantInfo.style.display = "grid";
        addPlantInfo.style.opacity = "1";
        document.querySelector("#image-name").textContent = file.name;
        document.querySelector("#user-photo").innerHTML = `
        <img src="data:image/jpeg;base64,${base64Image}" alt="${topSuggestion.name}">`;
        document.querySelector("#plant-type").textContent = topSuggestion.name;
        document.querySelector("#plant-care-output").textContent = careSummary;;
      } else {
        alert("Plant could not be identified.");
      }
    } catch (err) {
      console.error("Plant identification failed:", err);
    }
  });
}

cameraInput.addEventListener("change", () => {
  if (cameraInput.files.length > 0) handleImageSelection(cameraInput.files[0]);
});

photoInput.addEventListener("change", () => {
  if (photoInput.files.length > 0) handleImageSelection(photoInput.files[0]);
});


    savePlant.addEventListener("click", () => {
        const plantName = document.querySelector("#plant-name-input").value.trim();
        if (!plantName) {
            alert("Please give your plant a name!");
            return;
        }

        const newPlant = {
            name: plantName,
            species: currentPlant.species,
            careSummary: currentPlant.careSummary,
            image: currentPlant.image,
        };

        savedPlants.push(newPlant);
        localStorage.setItem("savedPlants", JSON.stringify(savedPlants));
        displaySavedPlants();

        openPlantInfo(newPlant);
        addPlantCard.style.display = "none";
    });

  function displaySavedPlants() {
    // const homeCont = document.querySelector("#plants-home");
    const plantCont = document.querySelector("#plants-list");
    // homeCont.innerHTML = "";
    plantCont.innerHTML = "";

    savedPlants.forEach((plant, index) => {
      const card = document.createElement("div");
      card.classList.add("plant-card");
      card.innerHTML = `
        <h1 class="sherika">${plant.name}</h1>
        <p class="dm-reg">${plant.species}</p>
        <img src="${plant.image}" alt="${plant.name}">
      `;
      card.addEventListener("click", () => openPlantInfo(plant));
    //   homeCont.appendChild(card.cloneNode(true));
      plantCont.appendChild(card);
    });
  }

  function openPlantInfo(plant) {
    document.querySelector("#plant-screen-name").textContent = plant.name;
    document.querySelector("#plant-screen-type").textContent = plant.species;
    document.querySelector("#plant-screen-care").textContent = plant.careSummary;
    document.querySelector("#plant-img").style.backgroundImage = `url(${plant.image})`;

    titleBar.style.display = "none";

    switchScreens(plantScreen, plantInfoScreen);
  }

  displaySavedPlants();
});
