const API_URL = "http://localhost:5000/api/history";

const historyList = document.getElementById("historyList");
const emptyState = document.getElementById("emptyState");

async function loadHistory() {
const token = localStorage.getItem("cyberproofToken");

```
if (!token) {
    window.location.href = "login.html";
    return;
}

try {
    const response = await fetch(API_URL, {
        method: "GET",
        headers: {
            Authorization: "Bearer " + token
        }
    });

    const data = await response.json();

    if (response.status === 401) {
        localStorage.removeItem("cyberproofToken");
        localStorage.removeItem("cyberproofUser");
        window.location.href = "login.html";
        return;
    }

    if (!response.ok) {
        throw new Error(
            data.error || "Could not load scan history."
        );
    }

    showHistory(data);

} catch (error) {
    console.error(error);

    if (historyList) {
        historyList.innerHTML = "";

        const errorCard = document.createElement("div");
        errorCard.className = "content-card";

        const heading = document.createElement("h2");
        heading.textContent = "Could not load history";

        const message = document.createElement("p");
        message.style.marginTop = "10px";
        message.style.color = "#666666";
        message.textContent =
            "Make sure the CyberProof backend is running.";

        errorCard.appendChild(heading);
        errorCard.appendChild(message);

        historyList.appendChild(errorCard);
    }
}
```

}

function showHistory(history) {
if (!historyList || !emptyState) {
return;
}

```
historyList.innerHTML = "";

if (!Array.isArray(history) || history.length === 0) {
    emptyState.style.display = "block";
    return;
}

emptyState.style.display = "none";

history.forEach(function(scan) {
    const card = document.createElement("div");
    card.className = "content-card";

    const type = document.createElement("strong");
    type.textContent =
        String(scan.type || "SCAN").toUpperCase();

    const date = document.createElement("p");
    date.style.color = "#666666";
    date.style.fontSize = "13px";
    date.style.marginTop = "8px";

    date.textContent = scan.createdAt
        ? new Date(scan.createdAt).toLocaleString()
        : "Unknown date";

    const inputTitle = document.createElement("small");
    inputTitle.textContent = "CHECKED INPUT";
    inputTitle.style.display = "block";
    inputTitle.style.marginTop = "18px";
    inputTitle.style.color = "#666666";
    inputTitle.style.fontWeight = "900";
    inputTitle.style.letterSpacing = "1px";

    const input = document.createElement("p");
    input.textContent = scan.input || "No input";
    input.style.marginTop = "8px";
    input.style.wordBreak = "break-word";

    const status = document.createElement("span");
    status.className = "trust-pill";
    status.textContent =
        scan.status || "VERIFY FIRST";
    status.style.display = "inline-block";
    status.style.marginTop = "18px";

    const action = document.createElement("p");
    action.textContent =
        scan.action || "Verify first";
    action.style.marginTop = "12px";
    action.style.fontWeight = "700";

    card.appendChild(type);
    card.appendChild(date);
    card.appendChild(inputTitle);
    card.appendChild(input);
    card.appendChild(status);
    card.appendChild(action);

    historyList.appendChild(card);
});
```

}

loadHistory();
