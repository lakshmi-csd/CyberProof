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
        throw new Error(data.error || "Could not load history.");
    }

    historyList.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
        emptyState.style.display = "block";
        return;
    }

    emptyState.style.display = "none";

    data.forEach(function(scan) {
        const card = document.createElement("div");
        card.className = "content-card";

        card.innerHTML =
            "<strong>" +
            String(scan.type || "SCAN").toUpperCase() +
            "</strong>" +

            "<p style='color:#666666;font-size:13px;margin-top:8px;'>" +
            new Date(scan.createdAt).toLocaleString() +
            "</p>" +

            "<small style='display:block;margin-top:18px;color:#666666;font-weight:900;letter-spacing:1px;'>" +
            "CHECKED INPUT" +
            "</small>" +

            "<p style='margin-top:8px;word-break:break-word;'>" +
            scan.input +
            "</p>" +

            "<span class='trust-pill' style='display:inline-block;margin-top:18px;'>" +
            (scan.status || "VERIFY FIRST") +
            "</span>" +

            "<p style='margin-top:12px;font-weight:700;'>" +
            (scan.action || "Verify first") +
            "</p>";

        historyList.appendChild(card);
    });

} catch (error) {
    console.error("History error:", error);

    historyList.innerHTML =
        "<div class='content-card'>" +
        "<h2>Could not load history</h2>" +
        "<p style='margin-top:10px;color:#666666;'>" +
        error.message +
        "</p>" +
        "</div>";
}
```

}

loadHistory();
