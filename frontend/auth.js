document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("cyberproofToken");
    const storedUser = localStorage.getItem("cyberproofUser");

    const navLinks = document.querySelector(".nav-links");

    if (!navLinks) {
        return;
    }

    const existingAuthButton = navLinks.querySelector(".nav-button");

    if (token) {
        let email = "Profile";

        try {
            const userData = JSON.parse(storedUser);
            if (userData && userData.email) {
                email = userData.email;
            }
        } catch (error) {
            if (storedUser) {
                email = storedUser;
            }
        }

        if (existingAuthButton) {
            existingAuthButton.remove();
        }

        const profileButton = document.createElement("a");
        profileButton.href = "#";
        profileButton.className = "nav-button";
        profileButton.textContent = "Profile";
        profileButton.id = "profileButton";

        navLinks.appendChild(profileButton);

        profileButton.addEventListener("click", function (event) {
            event.preventDefault();

            const shouldLogout = confirm(
                "Logged in as " + email + "\n\nDo you want to log out?"
            );

            if (shouldLogout) {
                localStorage.removeItem("cyberproofToken");
                localStorage.removeItem("cyberproofUser");

                window.location.href = "index.html";
            }
        });

    } else {
        if (existingAuthButton) {
            existingAuthButton.textContent = "Sign in";
            existingAuthButton.href = "login.html";
        }
    }
});