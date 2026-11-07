(() => {
  const links = Array.from(document.querySelectorAll(".timeline-nav__link"));
  const navList = document.querySelector(".timeline-nav__list");

  if (!links.length || !navList) {
    return;
  }

  const targets = links
    .map((link) => {
      const id = link.getAttribute("href")?.slice(1);
      const element = id ? document.getElementById(id) : null;
      return element ? { id, element, link } : null;
    })
    .filter(Boolean);

  if (!targets.length) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileViewport = window.matchMedia("(max-width: 899px)");
  const targetById = new Map(targets.map((target) => [target.id, target]));
  const intersecting = new Set();
  let activeId = links.find((link) => link.classList.contains("is-active"))
    ?.getAttribute("href")
    ?.slice(1);
  let observer;

  const revealLink = (link) => {
    if (!mobileViewport.matches || navList.scrollWidth <= navList.clientWidth) {
      return;
    }

    const left = link.offsetLeft - (navList.clientWidth - link.offsetWidth) / 2;
    navList.scrollTo({
      left: Math.max(0, left),
      behavior: reducedMotion.matches ? "auto" : "smooth"
    });
  };

  const setActive = (id) => {
    if (!id || id === activeId || !targetById.has(id)) {
      return;
    }

    activeId = id;
    targets.forEach((target) => {
      const isActive = target.id === id;
      target.link.classList.toggle("is-active", isActive);

      if (isActive) {
        target.link.setAttribute("aria-current", "true");
        revealLink(target.link);
      } else {
        target.link.removeAttribute("aria-current");
      }
    });
  };

  const chooseActiveTarget = () => {
    let closest = null;
    let closestDistance = Infinity;

    intersecting.forEach((id) => {
      const target = targetById.get(id);
      if (!target) {
        return;
      }

      const distance = Math.abs(target.element.getBoundingClientRect().top);
      if (distance < closestDistance) {
        closest = target;
        closestDistance = distance;
      }
    });

    if (closest) {
      setActive(closest.id);
    }
  };

  const observeTargets = () => {
    if (observer) {
      observer.disconnect();
    }

    intersecting.clear();
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id;
        if (entry.isIntersecting) {
          intersecting.add(id);
        } else {
          intersecting.delete(id);
        }
      });

      chooseActiveTarget();
    }, {
      rootMargin: "0px 0px -40% 0px",
      threshold: 0
    });

    targets.forEach((target) => observer.observe(target.element));
  };

  const initialHash = window.location.hash.slice(1);
  if (initialHash && targetById.has(initialHash)) {
    setActive(initialHash);
  }

  observeTargets();

  mobileViewport.addEventListener("change", () => {
    observeTargets();
    const activeLink = activeId ? targetById.get(activeId)?.link : null;
    if (activeLink) {
      revealLink(activeLink);
    }
  });
})();
