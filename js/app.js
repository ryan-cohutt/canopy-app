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
let allRemindersBtn = document.querySelector("#all-reminders-btn")
let remindersScreen = document.querySelector("#reminders-screen")
let addReminderCard = document.querySelector("#add-reminder-card")
let addReminderCloseBtn = document.querySelector("#add-reminder-close-btn");
let addReminderBtn = document.querySelector("#add-event-btn");
let addReminderHome = document.querySelector("#add-reminder-btn")
let recentReminders = document.querySelector("#recent-reminders-page")
let calendarDays = document.querySelector("#calendar-days")
let fullCareClose = document.querySelector("#full-close")
let fullCare = document.querySelector("#full-instructions")
let fullCareBtn = document.querySelector("#more-care-btn")
let screenBlur = document.querySelector('#screen-blur')


const monthYearEl = document.getElementById('month-year');
const calendarDaysEl = document.getElementById('calendar-days');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const selectedDateEl = document.getElementById('selected-date');
const eventsEl = document.getElementById('events');
const addEventBtn = document.getElementById('add-event-btn');
const addEventForm = document.getElementById('add-event-form');
const eventTitleInput = document.getElementById('event-title');
const eventTimeInput = document.getElementById('event-time');
const saveEventBtn = document.getElementById('save-event-btn');


let savedPlants = JSON.parse(localStorage.getItem('savedPlants')) || [];
let events = JSON.parse(localStorage.getItem('events')) || {};
let currentPlant = {};

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker
      .register("/sw.js")
      .then(res => console.log("service worker registered"))
      .catch(err => console.log("service worker not registered", err))
  })
}

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
    question: "Provide a short 2-sentence care summary for this plant in language that a normal person could understand.",
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

async function getCareParagraph(accessToken) {
  const apiKey = "Nq40v3XjyfBITZVmd44xhOYuC6I8YYF8AvJGTsYXoP9h3lA48r";
  const url = `https://plant.id/api/v3/identification/${accessToken}/conversation`;

  const paragraphCareData = {
    question: "Provide a full length, detailed care summary for this plant in language that a normal person could understand.",
    prompt: "Give answer in one continuous paragraph.",
    temperature: 0.5,
    app_name: "MyAppBot",
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": apiKey,
    },
    body: JSON.stringify(paragraphCareData),
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
  gridBtn.addEventListener("click", () => switchScreens(remindersScreen, homeScreen));
  plantGridBtn.addEventListener("click", () => {titleBar.style.display = "grid"; switchScreens(plantInfoScreen, homeScreen)});
  allRemindersBtn.addEventListener("click", () => switchScreens(homeScreen, remindersScreen));

  function switchScreens(from, to) {
    from.style.opacity = "0";
    setTimeout(() => {
      from.style.display = "none";
      to.style.display = "grid";
      setTimeout(() => (to.style.opacity = "1"), 15);
    }, 300);
    addPlantCard.style.opacity = "0";
    setTimeout(() => (addPlantCard.style.display = "none"), 300);
    addReminderCard.style.opacity = "0";
    setTimeout(() => (addReminderCard.style.display = "none"), 300);
    addPlantInfo.style.display = "none";
    addPlantImage.style.display = "grid";
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
            const careParagraphResult = await getCareParagraph(accessToken);
            console.log("Care instructions fetched:", careResult);
            console.log("Care paragraph fetched:", careParagraphResult);
            if (careResult) careSummary = careResult;
            if (careParagraphResult) careFull = careParagraphResult;
        } catch (err) {
          console.warn("Care instructions/paragraph failed:", err);
        }

        currentPlant = {
          species: topSuggestion.name,
          careSummary,
          careFull,
          image: "data:image/jpeg;base64," + base64Image,
        };

        addPlantImage.style.display = "none";
        addPlantInfo.style.display = "grid";
        addPlantInfo.style.opacity = "1";
        document.querySelector("#image-name").textContent = file.name;
        document.querySelector("#user-photo").innerHTML = `
        <img src="data:image/jpeg;base64,${base64Image}" alt="${topSuggestion.name}">`;
        document.querySelector("#plant-type").textContent = topSuggestion.name;
        document.querySelector("#plant-care-output").textContent = careSummary;
        document.querySelector("#full-instructions-content").textContent = careFull;
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
            careFull: currentPlant.careFull,
            image: currentPlant.image,
        };

        savedPlants.push(newPlant);
        localStorage.setItem("savedPlants", JSON.stringify(savedPlants));
        displaySavedPlants();

        openPlantInfo(newPlant);
        addPlantCard.style.display = "none";
        plantInfoScreen.style.display = "none"
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
    document.querySelector("#full-instructions-content").textContent = plant.careFull;
    document.querySelector("#plant-img").style.backgroundImage = `url(${plant.image})`;

    titleBar.style.display = "none";

    switchScreens(plantScreen, plantInfoScreen);
  }

  displaySavedPlants();
});

let currentDate = new Date();
let selectedDate = null;
// let events = {}; // Store events keyed by 'YYYY-MM-DD'

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayIndex = firstDay.getDay();
  const totalDays = lastDay.getDate();

  monthYearEl.textContent = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  calendarDaysEl.innerHTML = '';

  // Blank days before first day
  for (let i = 0; i < startDayIndex; i++) {
    const blankDiv = document.createElement('div');
    calendarDaysEl.appendChild(blankDiv);
  }

  // Days with numbers and dots
  for (let day = 1; day <= totalDays; day++) {
    const dayDiv = document.createElement('div');
    dayDiv.classList.add('calendar-day');
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    dayDiv.dataset.date = dateStr;

    // Day number centered
    const dayNumber = document.createElement('div');
    dayNumber.textContent = day;
    dayDiv.appendChild(dayNumber);

    // Dots container
    const dotsContainer = document.createElement('div');
    dotsContainer.classList.add('dots-container');
    const eventCount = events[dateStr]?.length || 0;
    const dotsToShow = Math.min(eventCount, 4);
    for (let i = 0; i < dotsToShow; i++) {
      const dot = document.createElement('span');
      dot.classList.add('dot');
      dotsContainer.appendChild(dot);
    }
    dayDiv.appendChild(dotsContainer);

    if (selectedDate === dateStr) {
      dayDiv.classList.add('selected');
    }

    dayDiv.addEventListener('click', () => {
      selectedDate = dateStr;
      renderCalendar();
      renderEvents();
    });

    calendarDaysEl.appendChild(dayDiv);
  }
}

fullCareBtn.addEventListener('click', () => {
  fullCare.style.display = "grid"
  screenBlur.style.display = "grid"
  setTimeout(() => {
    fullCare.style.opacity = "1"
    screenBlur.style.opacity = "1"
  }, 150);
})

fullCareClose.addEventListener('click', () => {
  fullCare.style.opacity = "0"
    screenBlur.style.opacity = "0"
  setTimeout(() => {
    fullCare.style.display = "none"
    screenBlur.style.display = "none"
  }, 150);
})

// function renderEvents() {
//   selectedDateEl.textContent = selectedDate || 'None';
//   eventsEl.innerHTML = '';
//   if (!selectedDate || !events[selectedDate]) {
//     eventsEl.textContent = 'No events';
//     return;
//   }
//   events[selectedDate].forEach(evt => {
//     const li = document.createElement('li');
//     li.textContent = `${evt.time} - ${evt.title}`;
//     eventsEl.appendChild(li);
//   });
// }

prevMonthBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
  // renderEvents();
  calendarChecker();
});

nextMonthBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
  // renderEvents();
  calendarChecker();
});

function calendarChecker() {
  let calendarThreshold = 270;

  if (calendarDays.offsetHeight > calendarThreshold) {
    recentReminders.style.height = '165px';
  } else {
    recentReminders.style.height = '210px'
  }
}

const now = new Date()

addReminderBtn.addEventListener('click', () => {
  if (!selectedDate) {
    alert('Please select a day first');
    return;
  }

  if (selectedDate < now) {
    alert('Please select a future day');
    return;
  }


  addReminderCard.style.display = "grid";
  setTimeout(() => {
      addReminderCard.style.opacity = "1";
      addReminderCard.style.bottom = "0";
      addReminderCard.style.top = 'auto';
  }, 300);
  
  addReminderCloseBtn.addEventListener("click", () => {
    addReminderCard.style.opacity = "0";
    setTimeout(() => (addReminderCard.style.display = "none"), 300);
  });
});


addReminderHome.addEventListener('click', () => {
  // if (!selectedDate) {
  //   alert('Please select a day first');
  //   return;
  // }

  addReminderCard.style.display = "grid";
  setTimeout(() => {
      addReminderCard.style.opacity = "1";
      addReminderCard.style.bottom = "0";
      addReminderCard.style.top = 'auto';
  }, 300);
  
  addReminderCloseBtn.addEventListener("click", () => {
    addReminderCard.style.opacity = "0";
    setTimeout(() => (addReminderCard.style.display = "none"), 300);
  });
});

addReminderCloseBtn.addEventListener('click', () => {
  addReminderCard.style.display = 'none';
  eventTitleInput.value = '';
  eventTimeInput.value = '';
});

saveEventBtn.addEventListener('click', () => {
  const title = eventTitleInput.value.trim();
  const time = eventTimeInput.value.trim();

  if (!title) {
    alert('Please enter an event title');
    return;
  }

  if (!events[selectedDate]) {
    events[selectedDate] = [];
  }

  events[selectedDate].push({ title, time });

  // SAVE TO LOCALSTORAGE HERE
  saveEvents();

  addReminderCard.style.display = 'none';
  eventTitleInput.value = '';
  eventTimeInput.value = '';
  renderCalendar();
  renderEvents();
});


function saveEvents() {
  localStorage.setItem('events', JSON.stringify(events));
}


// Initialize
renderCalendar();
