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
let plantDeleteBtn = document.querySelector('#plant-delete-btn')
let plantDeleteCard = document.querySelector('#plant-delete-card')
let deleteNoBtn = document.querySelector('#no-delete-btn')
let deleteYesBtn = document.querySelector('#yes-delete-btn')
let reminderEditCard = document.querySelector('#reminder-edit-card')
let reminderDeleteBtn = document.querySelector('#reminder-delete-btn')
let reminderCardClose = document.querySelector('#reminder-card-close')
let remindersContainer = document.querySelector("#recent-reminders");
let remindersPageContainer = document.querySelector("#recent-reminders-page");
let plantLoading = document.querySelector("#plant-loading")

const plantSelect = document.getElementById("plant-select");
const selectedName = document.getElementById("selected-plant-name");

const monthYearEl = document.getElementById('month-year');
const calendarDaysEl = document.getElementById('calendar-days');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const selectedDateEl = document.getElementById('selected-date');
const eventsEl = document.getElementById('events');
const dayReminderCont = document.getElementById('day-reminder-cont')
const addEventBtn = document.getElementById('add-event-btn');
const addEventForm = document.getElementById('add-event-form');
const eventTitleInput = document.getElementById('event-title');
const eventTimeInput = document.getElementById('event-time');
const saveEventBtn = document.getElementById('save-event-btn');

let selectedPlant = ""

const buttons = document.querySelectorAll(".event-type-btn");
let eventTypeSelected = null

buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    buttons.forEach(b => b.classList.remove("selected"));

    btn.classList.add("selected");

    eventTypeSelected = btn.textContent;
  });
});

let savedPlants = JSON.parse(localStorage.getItem('savedPlants')) || [];
let events = JSON.parse(localStorage.getItem('events')) || {};
let currentPlant = {};

savedPlants = savedPlants.filter(p =>
  p && typeof p === "object" && p.name && typeof p.name === "string"
);

let didUpgrade = false;

localStorage.setItem("savedPlants", JSON.stringify(savedPlants));


savedPlants.forEach(p => {
  if (!p.id) {
    p.id = crypto.randomUUID();
    didUpgrade = true;
  }
});

if (didUpgrade) {
  localStorage.setItem("savedPlants", JSON.stringify(savedPlants));
}

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
  plantGridBtn.addEventListener("click", () => {titleBar.style.display = "grid"; switchScreens(plantInfoScreen, plantScreen)});
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
  addPlantImage.style.display = "none";
  const loader = document.getElementById("plant-loading");
  loader.style.display = "grid";
  loader.style.opacity = "1";

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

        loader.style.opacity = "0";
        setTimeout(() => {
          loader.style.display = "none";
          addPlantInfo.style.display = "grid";
          addPlantInfo.style.opacity = "1";
          document.querySelector("#image-name").textContent = file.name;
          document.querySelector("#user-photo").innerHTML = `
            <img src="data:image/jpeg;base64,${base64Image}" alt="${topSuggestion.name}">`;
          document.querySelector("#plant-type").textContent = topSuggestion.name;
          document.querySelector("#plant-care-output").textContent = careSummary;
          document.querySelector("#full-instructions-content").textContent = careFull;
        }, 300);
      } else {
        loader.style.display = "none";
        addPlantImage.style.display = "grid";
        alert("Plant could not be identified.");
      }
    } catch (err) {
      loader.style.display = "none";
      addPlantImage.style.display = "grid";
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

        const duplicate = savedPlants.some(p =>
          p &&
          typeof p.name === "string" &&
          p.name.trim().toLowerCase() === plantName.trim().toLowerCase()
        );

        if (duplicate) {
          alert("You already have a plant with that name. Please choose a different name.");
          return;
        }

        const newPlant = {
            id: crypto.randomUUID(),
            name: plantName,
            species: currentPlant.species,
            careSummary: currentPlant.careSummary,
            careFull: currentPlant.careFull,
            image: currentPlant.image,
        };

        savedPlants.push(newPlant);
        localStorage.setItem("savedPlants", JSON.stringify(savedPlants));
        displaySavedPlants();
        displayHomeReminders();
        displayHomeReminders(remindersPageContainer);
        populatePlantSelect();
        displayHomePlants();

        openPlantInfo(newPlant, savedPlants.length - 1);
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
      card.addEventListener("click", () => {
        openPlantInfo(plant, index);
      });

    //   homeCont.appendChild(card.cloneNode(true));
      plantCont.appendChild(card);
    });
  }

  function populatePlantSelect() {
    // const plantSelect = document.getElementById("plant-select");
    plantSelect.innerHTML = `<option value="">select a plant</option>`;

    savedPlants.forEach((plant, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = plant.name;
      plantSelect.appendChild(option);
    });
  }

  
  document.getElementById("plant-select").addEventListener("change", (e) => {
    const idx = e.target.value;

    if (idx === "") {
      selectedName.textContent = "None";
      return;
    }

    selectedPlant = savedPlants[idx].name;
  });


  function openPlantInfo(plant, index) {
    document.querySelector("#plant-screen-name").textContent = plant.name;
    document.querySelector("#plant-screen-type").textContent = plant.species;
    document.querySelector("#plant-screen-care").textContent = plant.careSummary;
    document.querySelector("#full-instructions-content").textContent = plant.careFull;
    document.querySelector("#plant-img").style.backgroundImage = `url(${plant.image})`;

    updatePlantReminders(plant.name);

    titleBar.style.display = "none";

    plantDeleteBtn.onclick = () => {
      plantDeleteCard.style.display = "grid";
      screenBlur.style.display = "grid"
      setTimeout(() => {
        plantDeleteCard.style.opacity = "1";
        screenBlur.style.opacity = "1"
      }, 200);

      deleteNoBtn.replaceWith(deleteNoBtn.cloneNode(true));
      deleteYesBtn.replaceWith(deleteYesBtn.cloneNode(true));

      const newNo = document.querySelector('#no-delete-btn');
      const newYes = document.querySelector('#yes-delete-btn');

      newNo.addEventListener("click", () => {
          plantDeleteCard.style.opacity = "0";
          screenBlur.style.opacity = "0"
          setTimeout(() => {
            plantDeleteCard.style.display = "none";
            screenBlur.style.display = "none"
          }, 200);
      });

      newYes.addEventListener("click", () => {
          plantDeleteCard.style.opacity = "0";
          screenBlur.style.opacity = "0"
          setTimeout(() => {
            plantDeleteCard.style.display = "none";
            screenBlur.style.display = "none"
          }, 200);
          switchScreens(plantInfoScreen, plantScreen);
          titleBar.style.display = "grid";
          deletePlant(index);
      });
    };


    switchScreens(plantScreen, plantInfoScreen);
    switchScreens(homeScreen, plantInfoScreen);
  }

  displaySavedPlants();
  populatePlantSelect();
  displayHomePlants();
  displayHomeReminders();
  displayHomeReminders(remindersPageContainer);

let currentDate = new Date();
let selectedDate = formatDate(new Date());

renderEvents(selectedDate);
// let events = {};

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

  for (let day = 1; day <= totalDays; day++) {
    const dayDiv = document.createElement('div');
    dayDiv.classList.add('calendar-day');
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    dayDiv.dataset.date = dateStr;

    // Day number
    const dayNumber = document.createElement('div');
    dayNumber.textContent = day;
    dayDiv.appendChild(dayNumber);

    // Dot with number inside
    const eventCount = events[dateStr]?.length || 0;
    if (eventCount > 0) {
      const dot = document.createElement('div');
      dot.classList.add('dot-number');
      dot.classList.add('dm-black');

      const allCompleted = events[dateStr].every(evt => evt.completed);
      if (allCompleted) {
        dot.classList.add('completed-dot');
      } else {}

      dot.textContent = eventCount;
      dayDiv.appendChild(dot);
    }

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

function renderEvents() {
  dayReminderCont.innerHTML = '';
  if (!selectedDate || !events[selectedDate]) {
    // dayReminderCont.innerHTML = '<p>No events</p>';
    return;
  }

  events[selectedDate].forEach((evt, index) => {
    const div = document.createElement('div');
    div.innerHTML = `<h1 class="dm-light">${evt.type} <span class="sherika" style="font-size: 19px;">${evt.plant}</span></h1>
                     <div><h1 class="sherika">${evt.time}</h1></div>`;

    div.classList.add('day-reminder-card');

    if (evt.completed) {
      div.style.backgroundColor = "#95DB59";

      const h1 = div.querySelector('h1.dm-light');
      if (h1) h1.style.color = "#19101A";

      const plantSpan = div.querySelector('span.sherika');
      if (plantSpan) plantSpan.style.color = "#19101A";

      const timeH1 = div.querySelector('div h1.sherika');
      if (timeH1) timeH1.style.color = "#95DB59";

      div.style.cursor = "default";
    } else {
      div.addEventListener('click', () => {
        reminderPopup(selectedDate, index);
      });
    }

    dayReminderCont.appendChild(div);
  });
}


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
  
  const today = new Date();
  const selectedDateObj = new Date(selectedDate + "T00:00");
  if (selectedDateObj < today.setHours(0,0,0,0)) {
    alert("Please select today or a future day.");
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


// addReminderHome.addEventListener('click', () => {
//   // if (!selectedDate) {
//   //   alert('Please select a day first');
//   //   return;
//   // }

//   addReminderCard.style.display = "grid";
//   setTimeout(() => {
//       addReminderCard.style.opacity = "1";
//       addReminderCard.style.bottom = "0";
//       addReminderCard.style.top = 'auto';
//   }, 300);
  
//   addReminderCloseBtn.addEventListener("click", () => {
//     addReminderCard.style.opacity = "0";
//     setTimeout(() => (addReminderCard.style.display = "none"), 300);
//   });
// });

addReminderCloseBtn.addEventListener('click', () => {
  addReminderCard.style.display = 'none';
  // eventTitleInput.value = '';
  eventTimeInput.value = '';
  buttons.forEach(b => b.classList.remove("selected"));
  plantSelect.value = "";
  selectedName.textContent = "None"
});

saveEventBtn.addEventListener('click', () => {
  let time = eventTimeInput.value.trim();
  const type = eventTypeSelected
  const plant = selectedPlant

  const [y, m, d] = selectedDate.split("-").map(Number);
  const selectedDateObj = new Date(y, m - 1, d);

  const now = new Date();

  if (time) {
    const [hour, minute] = time.split(":");
    const date = new Date();
    date.setHours(hour, minute);

    if (selectedDateObj.toDateString() === now.toDateString()) {
      if (date < now) {
        alert("Please select a future time.");
        return;
      }
    }

    time = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).toLowerCase();
  }

  const correctedDate = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  if (!events[correctedDate]) {
    events[correctedDate] = [];
  }

  if (type == null) {
    alert('Please choose a reminder type');
    return;
  }

  if (plant == "") {
    alert('Please choose a plant');
    return;
  }

  if (time == "") {
    alert('Please choose a time');
    return;
  }

  events[correctedDate].push({ time, type, plant, completed: false });

  saveEvents();

  addReminderCard.style.display = 'none';
  // eventTitleInput.value = '';
  eventTimeInput.value = '';
  buttons.forEach(b => b.classList.remove("selected"));
  plantSelect.value = "";
  renderCalendar();
  renderEvents();
  displayHomeReminders();
  displayHomeReminders(remindersPageContainer);
});


function saveEvents() {
  localStorage.setItem('events', JSON.stringify(events));
}

renderCalendar();

function deletePlant(index) {
  if (index === -1 || !savedPlants[index]) {
    console.error("deletePlant: invalid index", index);
    return;
  }

  const deletedPlant = savedPlants[index].name;

  savedPlants.splice(index, 1);

  for (const date in events) {
    events[date] = events[date].filter(evt => evt.plant !== deletedPlant);

    if (events[date].length === 0) {
      delete events[date];
    }
  }

  localStorage.setItem("savedPlants", JSON.stringify(savedPlants));
  localStorage.setItem("events", JSON.stringify(events));

  displaySavedPlants();
  displayHomePlants();
  displayHomeReminders();
  displayHomeReminders(remindersPageContainer);
  populatePlantSelect();
  renderCalendar();
  renderEvents();
}

function reminderPopup(dateStr, index) {
  reminderEditCard.style.display = "grid"
  screenBlur.style.display = "grid"
  setTimeout(() => {
    reminderEditCard.style.opacity = "1";
    screenBlur.style.opacity = "1"
  }, 200);
  reminderDeleteBtn.addEventListener('click', () => {
    if (!events[dateStr]) return;

    events[dateStr].splice(index, 1);

    if (events[dateStr].length === 0) {
      delete events[dateStr];
    }

    localStorage.setItem("events", JSON.stringify(events));

    renderCalendar();
    renderEvents();
    displayHomeReminders();
    displayHomeReminders(remindersPageContainer);
    reminderEditCard.style.opacity = "0"
    screenBlur.style.opacity = "0"
    setTimeout(() => {
      reminderEditCard.style.display = "none";
      screenBlur.style.display = "none"
    }, 200);
  })
  reminderCardClose.addEventListener('click', () => {
    reminderEditCard.style.opacity = "0"
    screenBlur.style.opacity = "0"
    setTimeout(() => {
      reminderEditCard.style.display = "none";
      screenBlur.style.display = "none"
    }, 200);
  })
}

function displayHomePlants() {
  const homeCont = document.querySelector("#plants-home");
  const templateCards = Array.from(homeCont.querySelectorAll(".plant-card"));

  const plantCards = templateCards.slice(0, 3);
  const maxHomePlants = plantCards.length;

  const recentPlants = savedPlants.slice(-maxHomePlants).reverse();

  plantCards.forEach((card, i) => {
    if (recentPlants[i]) {
      card.querySelector("h1.sherika").textContent = recentPlants[i].name;
      card.querySelector("p.dm-reg").textContent = recentPlants[i].species;
      card.querySelector("img").src = recentPlants[i].image;
      card.querySelector("img").alt = recentPlants[i].name;
      card.classList.remove("template-card");
      const plantIndex = savedPlants.findIndex(p => p.id === recentPlants[i].id);
      card.onclick = () => openPlantInfo(recentPlants[i], plantIndex);
    } else {
      card.querySelector("h1.sherika").textContent = "Plant Name";
      card.querySelector("p.dm-reg").textContent = "Species";
      card.querySelector("img").src = "images/template-plant.webp";
      card.querySelector("img").alt = "Plant Template Image";
      card.classList.add("template-card");
      card.onclick = null;
    }
  });
}



function displayHomeReminders(container = remindersContainer) {
  container.innerHTML = "";

  let allCompleted = [];

  const eventDates = Object.keys(events).sort((a, b) => new Date(a) - new Date(b));
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  eventDates.forEach(dateStr => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);

    let headerText = "";

    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;

    if (date.toDateString() === today.toDateString()) {
      headerText = `${formattedDate} TODAY`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      headerText = `${formattedDate} TOMORROW`;
    } else {
      headerText = formattedDate;
    }

    const incompleteReminders = events[dateStr].filter(r => !r.completed);
    const completedReminders = events[dateStr].filter(r => r.completed);

    if (incompleteReminders.length) {
      const dateHeader = document.createElement("h2");
      dateHeader.classList.add("dm-light");
      dateHeader.innerHTML = `<span class="dm-black">${formattedDate}</span> ${headerText.replace(formattedDate, "").trim()}`;
      container.appendChild(dateHeader);

      incompleteReminders.forEach(reminder => container.appendChild(createReminderCard(reminder, dateStr)));
    }

    allCompleted.push(...completedReminders.map(r => ({ ...r, dateStr })));
  });

  if (allCompleted.length) {
    const completedHeader = document.createElement("h2");
    completedHeader.textContent = "Completed";
    completedHeader.style.color = "#95DB59";
    completedHeader.classList.add("dm-xtra")
    container.appendChild(completedHeader);

    allCompleted.forEach(reminder => container.appendChild(createReminderCard(reminder, reminder.dateStr, true)));
  }

  addCheckboxListeners();
}


function addCheckboxListeners() {
  const checkboxes = document.querySelectorAll(".reminder-card input[type='checkbox']:not(:disabled)");
  checkboxes.forEach(cb => {
    cb.addEventListener("change", (e) => {
      if (cb.checked) {
        setTimeout(() => {
          const card = cb.closest(".reminder-card");
          const dateStr = card.dataset.date;
          const plantName = card.dataset.plant;

          const reminder = events[dateStr].find(r => r.plant === plantName && !r.completed);
          if (reminder) {
            reminder.completed = true;
            saveEvents();
          }

          displayHomeReminders();
          displayHomeReminders(remindersPageContainer);
          renderCalendar(); 
          renderEvents();
        }, 3000);
      }
    });
  });
}


function createReminderCard(reminder, dateStr, completed = false) {
  const plant = savedPlants.find(p => p.name === reminder.plant);
  const plantImage = plant ? plant.image : "images/template-plant.webp";

  const reminderCard = document.createElement("div");
  reminderCard.classList.add("reminder-card");

  if (completed) reminderCard.classList.add("completed");

  reminderCard.dataset.date = dateStr;
  reminderCard.dataset.plant = reminder.plant;

  reminderCard.innerHTML = `
    <img src="${plantImage}" alt="${reminder.plant}">
    <h1 class="sherika">${reminder.plant}</h1>
    <p class="dm-light">${reminder.type} at <span class="dm-black">${reminder.time}</span></p>
    <div>
      <label class="checkbox-wrapper">
        <input type="checkbox" ${completed ? "checked disabled" : ""}>
        <div class="custom-box">
          <svg width="26" height="20" viewBox="0 0 26 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 11.5135L8.34615 18L24 2" stroke="#95DB59" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </label>
    </div>
  `;
  return reminderCard;
}

function updatePlantReminders(plantName) {
  const remindersSect = document.querySelector("#plant-reminders-sect");
  const reminderDivs = remindersSect.querySelectorAll(".plant-reminder");

  const today = new Date();
  today.setHours(0,0,0,0);

  reminderDivs.forEach(reminderDiv => {
    const type = reminderDiv.querySelector("p.dm-reg").textContent.split(" ")[0]; 
    const numberH1 = reminderDiv.querySelector("h1.sherika");

    let upcomingEvents = [];

    for (const dateStr in events) {
      const eventDate = new Date(dateStr + "T00:00");
      events[dateStr].forEach(evt => {
        if (evt.plant === plantName && evt.type.toLowerCase() === type.toLowerCase() && !evt.completed) {
          upcomingEvents.push({ date: eventDate, dateStr, evt });
        }
      });
    }

    if (upcomingEvents.length === 0) {
      numberH1.textContent = "-";
      reminderDiv.style.cursor = "default";
      reminderDiv.onclick = null;
    } else {
      upcomingEvents.sort((a,b) => a.date - b.date);
      const nextEvent = upcomingEvents[0];
      const diffTime = nextEvent.date - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      numberH1.textContent = diffDays;

      reminderDiv.style.cursor = "pointer";
      reminderDiv.onclick = () => {
        switchScreens(plantInfoScreen, remindersScreen);
        titleBar.style.display = "grid"

        selectedDate = nextEvent.dateStr;

        renderCalendar();
        renderEvents();

        const reminderCards = remindersContainer.querySelectorAll(".reminder-card");
        const targetCard = Array.from(reminderCards).find(card => 
          card.dataset.plant === plantName &&
          card.querySelector("p").textContent.toLowerCase().includes(type.toLowerCase())
        );
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
          targetCard.classList.add("highlight");
          setTimeout(() => targetCard.classList.remove("highlight"), 2000);
        }
      };
    }
  });
}



});