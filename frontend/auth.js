document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("cyberproofToken");
    const storedUser = localStorage.getItem("cyberproofUser");

    const navLinks = document.querySelector(".nav-links");

    if (!navLinks) {
        return;
    }

    const authButton = navLinks.querySelector(".nav-button");

    if (!token) {
        return;
    }

    let email = "Account";

    try {
        const user = JSON.parse(storedUser);

        if (user && user.email) {
            email = user.email;
        }
    } catch (error) {
        if (storedUser) {
            email = storedUser;
        }
    }

    if (authButton) {
        authButton.textContent = "Profile";
        authButton.href = "#";
        authButton.id = "profileButton";
    }

    const overlay = document.createElement("div");
    overlay.id = "profileOverlay";

    overlay.style.cssText = `
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.35);
        z-index:9998;
        display:none;
    `;

    const sidebar = document.createElement("aside");
    sidebar.id = "profileSidebar";

    sidebar.style.cssText = `
        position:fixed;
        top:0;
        right:0;
        width:360px;
        max-width:90%;
        height:100vh;
        background:#ffffff;
        z-index:9999;
        box-shadow:-20px 0 60px rgba(0,0,0,0.20);
        padding:32px;
        transform:translateX(100%);
        transition:transform 0.25s ease;
        display:flex;
        flex-direction:column;
    `;

    sidebar.innerHTML = `
        <button id="closeProfile"
            style="
                align-self:flex-end;
                border:none;
                background:none;
                font-size:28px;
                cursor:pointer;
                color:#111;
            ">
            ×
        </button>

        <div style="margin-top:30px;">

            <span style="
                display:inline-block;
                padding:8px 13px;
                border-radius:999px;
                background:#d9ff52;
                color:#111;
                font-size:12px;
                font-weight:900;
            ">
                PROFILE
            </span>

            <h2 style="
                margin-top:20px;
                font-size:32px;
                color:#111;
            ">
                Your Account
            </h2>

            <p style="
                margin-top:10px;
                color:#666;
                word-break:break-word;
            ">
                ${email}
            </p>

        </div>

        <div style="
            margin-top:auto;
            padding-top:25px;
            border-top:1px solid #ddddda;
        ">

            <button id="logoutButton"
                style="
                    width:100%;
                    padding:15px;
                    border:none;
                    border-radius:14px;
                    background:#111111;
                    color:white;
                    font-weight:900;
                    cursor:pointer;
                ">
                Log out
            </button>

        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(sidebar);

    function openProfile() {
        overlay.style.display = "block";

        setTimeout(function () {
            sidebar.style.transform = "translateX(0)";
        }, 10);
    }

    function closeProfile() {
        sidebar.style.transform = "translateX(100%)";

        setTimeout(function () {
            overlay.style.display = "none";
        }, 250);
    }

    if (authButton) {
        authButton.addEventListener("click", function (event) {
            event.preventDefault();
            openProfile();
        });
    }

    document.getElementById("closeProfile").addEventListener(
        "click",
        closeProfile
    );

    overlay.addEventListener("click", closeProfile);

    document.getElementById("logoutButton").addEventListener(
        "click",
        function () {

            localStorage.removeItem("cyberproofToken");
            localStorage.removeItem("cyberproofUser");

            window.location.href = "index.html";
        }
    );
});