document.addEventListener("DOMContentLoaded", function () {
    const currentURL = window.location.href.split("#")[0].split("?")[0];

    document.querySelectorAll(".nav-links a").forEach(function (link) {
        link.classList.remove("active");

        const linkURL = link.href.split("#")[0].split("?")[0];

        if (linkURL === currentURL) {
            link.classList.add("active");
        }
    });
});