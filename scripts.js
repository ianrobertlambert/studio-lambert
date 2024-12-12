function updateTimeAndStatus() {
    const indicator = document.querySelector(".indicator");
    const hourElement = document.querySelector(".hour");
    const minuteElement = document.querySelector(".minute");
    const timezoneElement = document.querySelector(".timezone");

    // define office hours
    const officeStart = 9; // 09:00
    const officeEnd = 18;  // 17:00

    // get the current time in saint-raphaël, france
    const now = new Date();
    const options = { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hour12: false };
    const localeTime = new Intl.DateTimeFormat("en-GB", options).formatToParts(now);

    // extract hour and minute from the formatted time
    const currentHour = localeTime.find((part) => part.type === "hour").value;
    const currentMinute = localeTime.find((part) => part.type === "minute").value;

    // update the displayed time
    hourElement.textContent = currentHour;
    minuteElement.textContent = currentMinute;

    // get the full timezone name
    const formatter = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", timeZoneName: "short" });
    const timeZoneName = formatter.formatToParts(now).find((part) => part.type === "timeZoneName").value;
    timezoneElement.textContent = timeZoneName;

    // update the online/offline indicator
    if (currentHour >= officeStart && currentHour < officeEnd) {
        indicator.className = "indicator online";
    } else {
        indicator.className = "indicator after-hours";
    }
}

// function to update the year in the footer
function footerYear() {
    const currentYear = new Date().getFullYear();
    const yearElement = document.querySelector(".year");
    if (yearElement) {
        yearElement.textContent = currentYear;
    }
}

// run updateTimeAndStatus every second
setInterval(updateTimeAndStatus, 1000);

// initialise
updateTimeAndStatus();
footerYear();