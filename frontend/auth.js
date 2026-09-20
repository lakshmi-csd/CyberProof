document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("cyberproofToken");
    const storedUser = localStorage.getItem("cyberproofUser");

    const navLinks = document.querySelector(".nav-links");

    if (!navLinks || !token) {
        return;
    }

    const authButton = navLinks.querySelector(".nav-button");

    if (!authButton) {
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

    authButton.textContent = "Profile";
    authButton.href = "#";
    authButton.id = "profileButton";

    const profileBox = document.createElement("div");

    profileBox.id = "profileBox";

    profileBox.style.cssText = `
        position: absolute;
        top: 78px;
        right: 4%;
        width: 270px;
        background: #ffffff;
        border: 1px solid #ddddda;
        border-radius: 18px;
        padding: 20px;
        box-shadow: 0 15px 40px rgba(0,0,0,0.12);
        z-index: 9999;
        display: none;
    `;

    profileBox.innerHTML = `
        <div style="
            font-size:11px;
            font-weight:900;
            letter-spacing:1px;
            color:#777;
            margin-bottom:8px;
        ">
            PROFILE
        </div>

        <div style="
            font-size:18px;
            font-weight:800;
            color:#111;
            margin-bottom:6px;
        ">
            Your Account
        </div>

        <div style="
            font-size:14px;
            color:#666;
            word-break:break-word;
            margin-bottom:18px;
        ">
            ${email}
        </div>

        <button id="logoutButton" style="
            width:100%;
            padding:12px;
            border:none;
            border-radius:12px;
            background:#2563eb;
            color:#ffffff;
            font-weight:800;
            cursor:pointer;
        ">
            Log out
        </button>
    `;

    document.body.appendChild(profileBox);

    authButton.addEventListener("click", function (event) {
        event.preventDefault();

        if (profileBox.style.display === "none") {
            profileBox.style.display = "block";
        } else {
            profileBox.style.display = "none";
        }
    });

    document.getElementById("logoutButton").addEventListener(
        "click",
        function () {
            localStorage.removeItem("cyberproofToken");
            localStorage.removeItem("cyberproofUser");

            window.location.href = "index.html";
        }
    );

    document.addEventListener("click", function (event) {
        if (
            !profileBox.contains(event.target) &&
            event.target !== authButton
        ) {
            profileBox.style.display = "none";
        }
    });
});