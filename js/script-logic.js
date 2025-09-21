if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register("sw.js");
}

document.addEventListener('DOMContentLoaded', function () {

let nameForm = document.querySelector("#name-form")
let enterPage = document.querySelector(".enter-page")
let homePage = document.querySelector(".home-page")
let plantsPage = document.querySelector(".plants-page")
let remindersPage = document.querySelector(".reminders-page")
let tipsPage = document.querySelector(".tips-page")
let navBar = document.querySelector(".nav-bar")
let navBG = document.querySelector(".nav-bg")
let headerBar = document.querySelector(".header-bar")
let homeIcon = document.querySelector("#home-icon")
let plantsIcon = document.querySelector("#plants-icon")
let remindersIcon = document.querySelector("#reminders-icon")
let tipsIcon = document.querySelector("#tips-icon")
let iconBG = document.querySelector("#icon-bg")
let addPlant1 = document.querySelector("#add-new-plant1")
let addPlant2 = document.querySelector("#add-new-plant2")
let addPopup = document.querySelector(".add-popup")
let closePopup = document.querySelector("#popup-close")
let popupName = document.querySelector('#popup-name')
let popupSpecies = document.querySelector('#popup-species')
let popupImage = document.querySelector('#popup-image')
let popupCare = document.querySelector('#popup-care')
let popupSummary = document.querySelector('#popup-summary')
let plantPopup = document.querySelector('#plant-popup')
let closeSaved = document.querySelector('#close-popup')
let deletePlant = document.querySelector("#delete-plant")
let offlineMSG = document.querySelector(".offline-msg")
let fileInput = document.getElementById("fileInput");


function handleOffline() {
  console.log('Device is offline.');
    fileInput.disabled = true;
  offlineMSG.style.display = "block"
}

function handleOnline() {
  console.log('Device is online.');
  fileInput.disabled = false;
  offlineMSG.style.display = "none"
}

if (!navigator.onLine) {
  handleOffline();
} else {
  handleOnline();
}

window.addEventListener('offline', handleOffline);
window.addEventListener('online', handleOnline);



//
// IDENTIFY SECTION
//

async function identifyPlant(base64Image) {
    const apiKey = "Nq40v3XjyfBITZVmd44xhOYuC6I8YYF8AvJGTsYXoP9h3lA48r";
    const apiUrl = "https://plant.id/api/v3/identification";
  
    const data = {
      images: [base64Image],
      latitude: 49.207,
      longitude: 16.608,
      similar_images: true,
    };
  
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Api-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result = await response.json();
      console.log("Plant identification result:", result);
  
      return result;
    } catch (error) {
      console.error("Error identifying plant:", error);
    }
  }

  function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  document.getElementById("identifyButton").onclick = async function () {
    const resultElement = document.getElementById("result");
    const careSummaryElement = document.getElementById("careSummary");
  
    if (fileInput.files.length === 0) {
      alert("Please upload an image first!");
      return;
    }
  
    const file = fileInput.files[0];
  
    try {
      const base64Image = await convertImageToBase64(file);
  
      currentPlant.image = `data:image/jpeg;base64,${base64Image}`;
  
      const identificationResult = await identifyPlant(base64Image);
  
      if (identificationResult.result && identificationResult.result.classification.suggestions) {
        const suggestions = identificationResult.result.classification.suggestions;
  
        const topSuggestion = suggestions[0];
        resultElement.innerHTML = `
            <h4 class="inter-italic">${topSuggestion.name}</h4>
        `;
          //${
          //   topSuggestion.similar_images.length > 0
          //     ? `<img src="${topSuggestion.similar_images[0].url_small}" alt="${topSuggestion.name}" title="Top match">`
          //     : "<p>No similar image available.</p>"
          //}
  
        const accessToken = identificationResult.access_token;
        console.log("Access Token:", accessToken);
  
        const { fullCareInstructions, careSummary } = await getCareInstructions(accessToken);
  
        careSummaryElement.innerHTML = `
          <h3 class="inter-bold">Care Summary:</h3>
          <p class="inter-reg">${careSummary}</p>
        `;
  
        currentPlant.fullCareInstructions = fullCareInstructions;
        currentPlant.careSummary = careSummary;
  
        handlePlantIdentificationSuccess(
          topSuggestion.name,
          careSummary,
          fullCareInstructions,
          currentPlant.image
        );
      } else {
        resultElement.textContent = "No plant detected or suggestions found.";
      }
    } catch (error) {
      console.error("Error processing the file:", error);
      resultElement.textContent = "Error identifying plant. Check the console for details.";
    }
  };
  


//
// CARE INSTRUCTIONS SECTION
//

async function getCareInstructions(accessToken) {
  const apiKey = 'Nq40v3XjyfBITZVmd44xhOYuC6I8YYF8AvJGTsYXoP9h3lA48r';
  const url = `https://plant.id/api/v3/identification/${accessToken}/conversation`;

  const fullCareData = {
    question: "Tell me how to take care of the plant",
    prompt: "Give answer in clear steps.",
    temperature: 0.5,
    app_name: "MyAppBot"
  };

  const summaryCareData = {
    question: "Provide a short 2-sentence care summary for this plant.",
    prompt: "Give answer in 2 sentences.",
    temperature: 0.5,
    app_name: "MyAppBot"
  };

  try {
    const fullCareResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey
      },
      body: JSON.stringify(fullCareData)
    });

    const fullCareResult = await fullCareResponse.json();
    console.log("Full Care Instructions API Response:", fullCareResult);

    const summaryCareResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey
      },
      body: JSON.stringify(summaryCareData)
    });

    const summaryCareResult = await summaryCareResponse.json();
    console.log("Care Summary API Response:", summaryCareResult);

    const fullCareInstructions = fullCareResult.messages && fullCareResult.messages.length > 1
      ? fullCareResult.messages[1].content
      : "Sorry, I couldn't fetch the full care instructions.";

    const careSummary = summaryCareResult.messages && summaryCareResult.messages.length > 1
      ? summaryCareResult.messages[3].content
      : "Sorry, I couldn't fetch a care summary.";

    return { fullCareInstructions, careSummary };
  } catch (error) {
    console.error("Error fetching care instructions:", error);
    return {
      fullCareInstructions: "Sorry, there was an error fetching the full care instructions.",
      careSummary: "Sorry, there was an error fetching the care summary."
    };
  }
}


//
// SAVED PLANTS SECTION
//



let savedPlants = JSON.parse(localStorage.getItem('savedPlants')) || [];
let currentPlant = {};

function savePlant(plantName, species, careSummary, fullCareInstructions, imageURL) {
  const newPlant = {
    name: plantName,
    species: species,
    careSummary: careSummary,
    fullCareInstructions: fullCareInstructions,
    image: imageURL,
  };

  savedPlants.push(newPlant);
  localStorage.setItem('savedPlants', JSON.stringify(savedPlants));
  displaySavedPlants();
}

function displaySavedPlants() {
  const plantsCont = document.querySelector('.plants-cont');
  plantsCont.innerHTML = '';

  savedPlants.forEach((plant, index) => {
    const plantItem = document.createElement('div');
    plantItem.classList.add('plant-item');
    
    plantItem.innerHTML = `
      <h1 class="source-black">${plant.name}</h1>
      <h2 class="inter-italic">${plant.species}</h2>
      <img src="${plant.image}" alt="${plant.name}" />
    `;
    
    plantItem.addEventListener('click', () => openPopup(plant, index));

    plantsCont.appendChild(plantItem);
  });
  if (savedPlants.length === 0) {
    plantsCont.innerHTML = "<p>No saved plants yet.</p>";
  }
}

function openPopup(plant, index) {
  popupName.textContent = plant.name;
  popupSpecies.textContent = plant.species;
  popupImage.src = plant.image;
  popupSummary.textContent = plant.careSummary;
  popupCare.textContent = plant.fullCareInstructions;

  currentPlant = { ...plant, index };

  plantPopup.style.display = 'grid';
}

closeSaved.addEventListener("click", closeSavedPopup)

function closeSavedPopup() {
  plantPopup.style.display = 'none';
}

deletePlant.addEventListener("click", deletePlantFromPopup)

function deletePlantFromPopup() {
  savedPlants.splice(currentPlant.index, 1);
  localStorage.setItem('savedPlants', JSON.stringify(savedPlants));

  closeSavedPopup();

  displaySavedPlants();
}

document.getElementById('save-plant').addEventListener('click', () => {
  const plantName = document.getElementById('plant-name').value.trim();
  if (!plantName) {
    alert('Please give your plant a name!');
    return;
  }

  savePlant(
    plantName,
    currentPlant.species,
    currentPlant.careSummary,
    currentPlant.fullCareInstructions,
    currentPlant.image
  );

  document.getElementById('plant-name').value = '';
  alert('Plant saved successfully!');

  addPopup.style.display = "none"
});

function showNameAndSaveSection() {
  document.getElementById('name-and-save').style.display = 'grid';
}

function handlePlantIdentificationSuccess(species, careSummary, fullCareInstructions, imageURL) {
  currentPlant = {
    species: species,
    careSummary: careSummary,
    fullCareInstructions: fullCareInstructions,
    image: imageURL
  };

  showNameAndSaveSection();
}

displaySavedPlants();



//
// FILE INPUT BUTTON SWITCHER
//

let fileUploader = document.getElementById('fileInput');
let uploadButton = document.getElementById('file-label');
let uploadIcon = document.getElementById('upload-icon')

fileUploader.addEventListener('change', () => {
    if (fileUploader.files.length > 0) {
        uploadButton.style.backgroundColor = '#067A53';
        uploadButton.style.border = 'none';
        uploadButton.style.color = '#FFFBF7';
        uploadButton.style.fill = '#FFFBF7';
        uploadIcon.innerHTML = '<path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>'
        uploadIcon.setAttribute('viewBox','0 0 448 512')
    } else {
        uploadButton.style.backgroundColor = '';
    }
});


//
// PAGE SWITCHING SECTION
//

closePopup.addEventListener("click", function() {
    addPopup.style.opacity = "0"
    setTimeout(function(){
        addPopup.style.display = "none"
    }, 180)
})

addPlant1.addEventListener("click", function() {
    addPopup.style.display = "grid"
    setTimeout(function(){
        addPopup.style.opacity = "1"
    }, 180)
})

addPlant2.addEventListener("click", function(){
    addPopup.style.display = "grid"
    setTimeout(function(){
        addPopup.style.opacity = "1"
    }, 250)
})


nameForm.addEventListener("submit", function(event){
    event.preventDefault()
    enterPage.style.opacity = "0"
    homePage.style.display = "grid"
    navBar.style.display = "flex"
    navBG.style.display = "block"
    headerBar.style.display = "grid"
    setTimeout(function(){
        enterPage.display = "none"
        homePage.style.opacity = "1"
        navBar.style.opacity = "1"
        navBG.style.opacity = "1"
        headerBar.style.opacity = "1"
    }, 250)
})

homeIcon.addEventListener("click", function(){
    hideAllPages()
    setTimeout(function(){
        homePage.style.display = "grid"
        setTimeout(function(){
            homePage.style.opacity = "1"
            iconBG.style.marginLeft = "0"
        }, 50)
    }, 125)
})

plantsIcon.addEventListener("click", function(){
    hideAllPages()
    setTimeout(function(){
        plantsPage.style.display = "grid"
        setTimeout(function(){
            plantsPage.style.opacity = "1"
            iconBG.style.marginLeft = "80px"
        }, 50)
    }, 125)
})

remindersIcon.addEventListener("click", function(){
    hideAllPages()
    setTimeout(function(){
        remindersPage.style.display = "grid"
        setTimeout(function(){
            remindersPage.style.opacity = "1"
            iconBG.style.marginLeft = "160px"
        }, 50)
    }, 125)
})

tipsIcon.addEventListener("click", function(){
    hideAllPages()
    setTimeout(function(){
        tipsPage.style.display = "grid"
        setTimeout(function(){
            tipsPage.style.opacity = "1"
            iconBG.style.marginLeft = "240px"
        }, 50)
    }, 125)
})

function hideAllPages() {
    homePage.style.opacity = "0"
    plantsPage.style.opacity = "0"
    remindersPage.style.opacity = "0"
    tipsPage.style.opacity = "0"
    homeIcon.style.backgroundColor = "transparent"
    plantsIcon.style.backgroundColor = "transparent"
    remindersIcon.style.backgroundColor = "transparent"
    tipsIcon.style.backgroundColor = "transparent"
    setTimeout(function(){
        homePage.style.display = "none"
        plantsPage.style.display = "none"
        remindersPage.style.display = "none"
        tipsPage.style.display = "none"
    }, 125)
}

});