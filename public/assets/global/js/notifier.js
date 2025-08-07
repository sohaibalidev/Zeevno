(function setupNotifier() {
    // Create and append the notify div
    const notifyDiv = document.createElement('div');
    notifyDiv.id = 'notify';
    document.body.appendChild(notifyDiv);

    // Load custom notifier CSS
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = '/g/css/notifier.css';
    document.head.appendChild(cssLink);

    // Load Boxicons CSS
    const boxiconsLink = document.createElement('link');
    boxiconsLink.rel = 'stylesheet';
    boxiconsLink.href = 'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css';
    document.head.appendChild(boxiconsLink);
})();

function notify(message, type = "success", delay = 5, callback = null) {
    if (typeof type === 'function') [callback, type] = [type, "success"];
    else if (typeof delay === 'function') [callback, delay] = [delay, 5];

    const popup = document.getElementById("notify");
    if (!popup) return;

    const icon = document.createElement("i");
    icon.className = `notify-icon ${{
        success: "bx bx-check-circle",
        info: "bx bx-info-circle",
        warning: "bx bx-error",
        error: "bx bx-x-circle",
        alert: "bx bx-error-alt",
    }[type] || "bx bx-info-circle"}`;

    const messageSpan = document.createElement("span");
    messageSpan.textContent = message;

    const closeIcon = document.createElement("i");
    closeIcon.className = "bx bx-x";

    const closeButton = document.createElement("button");
    closeButton.className = "notify-close";
    closeButton.onclick = hideNotify;
    closeButton.append(closeIcon);

    const timerBar = document.createElement("div");
    timerBar.className = "notify-timer";
    timerBar.style.animation = `progress ${delay}s linear forwards`;

    popup.replaceChildren(icon, messageSpan, closeButton, timerBar);
    popup.className = `notify-${type}`;
    popup.style.display = "flex";
    popup.style.cursor = callback ? 'pointer' : 'default';
    popup.onclick = callback ? (e) => !e.target.closest('.notify-close') && callback() : null;

    clearTimeout(popup.timeout);
    popup.timeout = setTimeout(hideNotify, delay * 1000);
}

function hideNotify() {
    const popup = document.getElementById("notify");
    popup?.style && (popup.style.display = "none", popup.onclick = null);
}
