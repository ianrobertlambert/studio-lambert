function updateTimeAndStatus() {
    const indicator = document.getElementById("indicator");
    const hourElement = document.getElementById("hour");
    const minuteElement = document.getElementById("minute");
    const timezoneElement = document.getElementById("timezone");

    // Define office hours (in 24-hour format)
    const officeStart = 9; // 09:00
    const officeEnd = 18;  // 17:00

    // Get the current time in Saint-Raphaël, France
    const now = new Date();
    const options = { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hour12: false };
    const localeTime = new Intl.DateTimeFormat("en-GB", options).formatToParts(now);

    // Extract hour and minute from the formatted time
    const currentHour = localeTime.find((part) => part.type === "hour").value;
    const currentMinute = localeTime.find((part) => part.type === "minute").value;

    // Update the displayed time
    hourElement.textContent = currentHour;
    minuteElement.textContent = currentMinute;

    // Get the full timezone name (e.g., "CEST" or "CET")
    const formatter = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", timeZoneName: "short" });
    const timeZoneName = formatter.formatToParts(now).find((part) => part.type === "timeZoneName").value;
    timezoneElement.textContent = timeZoneName;

    // Update the online/offline indicator
    if (currentHour >= officeStart && currentHour < officeEnd) {
        indicator.className = "online";
    } else {
        indicator.className = currentHour < officeStart ? "offline" : "after-hours";
    }
}

// Function to update the year in the footer
function footerYear() {
    const currentYear = new Date().getFullYear();  // Get the current year
    const yearElement = document.getElementById("year");
    if (yearElement) {
        yearElement.textContent = currentYear;  // Update the year in the footer
    }
}

// Run updateTimeAndStatus every second
setInterval(updateTimeAndStatus, 1000);

// Initialise
updateTimeAndStatus();
footerYear();