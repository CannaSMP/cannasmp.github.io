const copyButtons = document.querySelectorAll("[data-copy]");

copyButtons.forEach((button) => {
  const label = button.querySelector(".copy-label");
  const originalLabel = label ? label.textContent : "";

  button.addEventListener("click", async () => {
    const value = button.dataset.copy;

    try {
      await navigator.clipboard.writeText(value);
      if (label) {
        label.textContent = "Copied";
      }
    } catch {
      if (label) {
        label.textContent = value;
      }
    }

    window.setTimeout(() => {
      if (label) {
        label.textContent = originalLabel;
      }
    }, 1800);
  });
});

const navLinks = [...document.querySelectorAll(".nav-links a")];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-45% 0px -45% 0px" }
);

sections.forEach((section) => observer.observe(section));
