document.addEventListener("DOMContentLoaded", function () {
  const timeElement = document.getElementById("time-current");
  const statusDot = document.querySelector(".header__status");
  function updateTime() {
    const now = new Date();
    const options = {
      timeZone: "Europe/Paris",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };
    const timeString = now.toLocaleTimeString("en-GB", options);
    timeElement.textContent = timeString + " France";
    const hour = now.getHours();
    if (statusDot) {
      if (hour >= 9 && hour < 18) {
        statusDot.style.backgroundColor = "var(--color-lime)";
      } else {
        statusDot.style.backgroundColor = "var(--color-grey-60)";
      }
    }
  }

  function updateCopyrightYear() {
    const yearElement = document.querySelector(".copyright-year");
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  }

  let timeInterval;
  let logoInterval;
  let slideshowInterval;

  function handleVisibilityChange() {
    if (document.hidden) {
      clearInterval(timeInterval);
      clearInterval(logoInterval);
      clearInterval(slideshowInterval);
    } else {
      timeInterval = setInterval(updateTime, 1000);
      if (document.querySelector(".logo__grid")) {
        logoInterval = setInterval(updateLogoGrid, 5000);
      }
    }
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);

  timeInterval = setInterval(updateTime, 1000);
  updateTime();
  updateCopyrightYear();

  const accordionGroups = document.querySelectorAll(".accordion");
  document.querySelectorAll("[data-accordion__item]").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (e.target.closest(".accordion__toggle")) return;

      const button = item.querySelector(".accordion__toggle");
      const isExpanded = button.getAttribute("aria-expanded") === "true";

      button.setAttribute("aria-expanded", !isExpanded);
      item.classList.toggle("open");

      const icon = button.querySelector("img");
      icon.src = isExpanded ? "/assets/icons/plus.svg" : "/assets/icons/minus.svg";
    });
  });

  document.querySelectorAll(".accordion__toggle").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const item = button.closest(".accordion__item");
      const isExpanded = button.getAttribute("aria-expanded") === "true";

      button.setAttribute("aria-expanded", !isExpanded);
      item.classList.toggle("open");

      const icon = button.querySelector("img");
      icon.src = isExpanded ? "/assets/icons/plus.svg" : "/assets/icons/minus.svg";
    });
  });

  document.querySelectorAll(".accordion__item.open").forEach((item) => {
    const button = item.querySelector(".accordion__toggle");
    button.setAttribute("aria-expanded", "true");
    const icon = button.querySelector("img");
    icon.src = "/assets/icons/minus.svg";
  });

  if (document.querySelector(".logo__grid")) {
    initializeLogoGrid();
  }
  if (document.querySelector(".work-feed")) {
    initializeWorkFeed();
  } else {
    const workSliderContainer = document.querySelector(".work-slideshow");
    if (workSliderContainer) {
      initializeWorkSlideshow();
    }
  }

  const menuOverlay = document.getElementById("menu-overlay");
  const menuButtons = document.querySelectorAll(".menu__toggle");

  if (menuOverlay && menuButtons.length) {
    menuButtons.forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        const isOpen = menuOverlay.classList.toggle("open");
        if (isOpen) {
          menuOverlay.scrollTop = 0;
        }
        document.body.style.overflow = isOpen ? "hidden" : "";
        menuButtons.forEach((b) => (b.textContent = isOpen ? "Close" : "Menu"));
      });
    });
  }
  const revealElements = document.querySelectorAll(".reveal");
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal--visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2,
    }
  );

  revealElements.forEach((el) => {
    revealObserver.observe(el);
  });
});

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function initializeLogoGrid() {
  const logoGrid = document.querySelector(".logo__grid");
  if (!logoGrid) return;

  try {
    const response = await fetch("/assets/images/clients/clients-manifest.json");
    if (!response.ok) return;
    const logoFiles = await response.json();

    if (!Array.isArray(logoFiles) || logoFiles.length === 0) return;

    for (let i = 0; i < 8; i++) {
      const cell = document.createElement("div");
      cell.className = "logo__cell";

      const img = document.createElement("img");
      img.alt = "Client logo";
      img.loading = "lazy";

      cell.appendChild(img);
      logoGrid.appendChild(cell);
    }

    await updateLogoGrid();
    logoInterval = setInterval(updateLogoGrid, 5000);
  } catch (error) {}
}

async function getRandomLogos(count, previousPositions = []) {
  try {
    const response = await fetch("/assets/images/clients/clients-manifest.json");
    if (!response.ok) return [];
    const allLogos = await response.json();

    if (allLogos.length < count) {
      return allLogos.slice(0, count);
    }

    let attempt = 0;
    let newLogos;
    do {
      newLogos = shuffleArray([...allLogos]).slice(0, count);
      attempt++;
      if (attempt > 20) break;
    } while (newLogos.some((logo, i) => logo === previousPositions[i]));

    return newLogos;
  } catch (error) {
    return [];
  }
}

let previousLogos = [];

async function updateLogoGrid() {
  const logoImages = document.querySelectorAll(".logo__cell img");

  try {
    const newLogos = await getRandomLogos(logoImages.length, previousLogos);

    if (newLogos.length === 0) {
      return;
    }

    previousLogos = newLogos;

    logoImages.forEach((img) => {
      img.classList.remove("visible");
    });

    setTimeout(() => {
      logoImages.forEach((img, index) => {
        const newSrc = `/assets/images/clients/${newLogos[index]}`;
        img.src = newSrc;

        img.onerror = function () {
          this.src = "/assets/images/placeholder.svg";
        };

        img.onload = function () {
          this.classList.add("visible");
        };
      });
    }, 300);
  } catch (error) {}
}

const workFeedState = {
  items: [],
  filteredItems: [],
  currentFilter: "all",
  isRandomized: false,
  pageSize: 4,
  currentPage: 1,
  lastRenderedRowCount: 0,
  allRows: [],
};

let loadMoreObserver;

async function initializeWorkFeed() {
  const workGrid = document.querySelector(".work-feed");
  if (!workGrid) return;

  try {
    const response = await fetch("/assets/images/work/work-manifest.json");
    if (!response.ok) return;
    const workItems = await response.json();

    if (!Array.isArray(workItems) || workItems.length === 0) return;

    const loadedItems = workItems.map((item) => ({
      src: item.src || `/assets/images/work/${item.file}`,
      file: item.file,
      category: item.category,
      title: item.title,
      description: item.description,
      isLandscape: item.isLandscape,
    }));
    workFeedState.items = loadedItems;
    workFeedState.filteredItems = shuffleArray([...workFeedState.items]);

    const itemsForRows = [...workFeedState.filteredItems];
    const allRows = [];
    const unpairedSquares = [];

    for (let i = 0; i < itemsForRows.length; i++) {
      const item = itemsForRows[i];
      if (item.isLandscape) {
        allRows.push({ type: "landscape", items: [item] });
      } else if (i + 1 < itemsForRows.length && !itemsForRows[i + 1].isLandscape) {
        allRows.push({
          type: "square",
          items: [item, itemsForRows[i + 1]],
        });
        i++;
      } else {
        unpairedSquares.push(item);
      }
    }

    for (let j = 0; j < unpairedSquares.length; j += 2) {
      if (j + 1 < unpairedSquares.length) {
        allRows.push({
          type: "square",
          items: [unpairedSquares[j], unpairedSquares[j + 1]],
        });
      } else {
        allRows.push({ type: "square", items: [unpairedSquares[j]] });
      }
    }

    workFeedState.allRows = allRows;

    workFeedState.currentFilter = "all";

    renderWorkFeed();
    setupFilterListeners();
    setupLoadMoreObserver();
  } catch (error) {}
}

function setupFilterListeners() {
  const filterButtons = document.querySelectorAll(".filter__button");
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      workFeedState.currentPage = 1;
      filterButtons.forEach((btn) => {
        btn.classList.remove("active");
        if (btn.dataset.category === "all") {
          btn.classList.add("text--subtle");
        }
      });
      button.classList.add("active");
      button.classList.remove("text--subtle");

      const category = button.dataset.category;
      filterWorkFeedItems(category);
    });
  });
}

function filterWorkFeedItems(category) {
  workFeedState.currentFilter = category;
  workFeedState.currentPage = 1;
  if (category === "all") {
    workFeedState.filteredItems = shuffleArray([...workFeedState.items]);
  } else {
    const target = category.toLowerCase();
    const matchedItems = workFeedState.items.filter((item) => item.category && item.category.toLowerCase() === target);
    workFeedState.filteredItems = shuffleArray(matchedItems);
  }

  const itemsForRows = [...workFeedState.filteredItems];
  const allRows = [];
  const unpairedSquares = [];

  for (let i = 0; i < itemsForRows.length; i++) {
    const item = itemsForRows[i];
    if (item.isLandscape) {
      allRows.push({ type: "landscape", items: [item] });
    } else if (i + 1 < itemsForRows.length && !itemsForRows[i + 1].isLandscape) {
      allRows.push({ type: "square", items: [item, itemsForRows[i + 1]] });
      i++;
    } else {
      unpairedSquares.push(item);
    }
  }

  for (let j = 0; j < unpairedSquares.length; j += 2) {
    if (j + 1 < unpairedSquares.length) {
      allRows.push({
        type: "square",
        items: [unpairedSquares[j], unpairedSquares[j + 1]],
      });
    } else {
      allRows.push({ type: "square", items: [unpairedSquares[j]] });
    }
  }

  workFeedState.allRows = allRows;

  renderWorkFeed();
}

function renderWorkFeed() {
  const workGrid = document.querySelector(".work-feed");
  if (!workGrid) return;

  const imageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.classList.add("loaded");
            if (img.parentNode) {
              img.parentNode.classList.remove("loading");
            }
            observer.unobserve(img);
          }
        }
      });
    },
    {
      rootMargin: "50px 0px",
      threshold: 0.01,
    }
  );

  const rows = workFeedState.allRows;
  const endRowIndex = workFeedState.pageSize * workFeedState.currentPage;
  const rowsToShow = rows.slice(0, endRowIndex);

  const appendRow = (row) => {
    const rowElement = document.createElement("div");
    rowElement.className = "image__row";
    if (row.type === "square") {
      rowElement.classList.add("square");
    } else {
      rowElement.classList.add("landscape");
    }
    row.items.forEach((item) => {
      const itemElement = document.createElement("div");
      itemElement.className = "image__item loading";
      const img = document.createElement("img");
      img.alt = "Work image";
      img.loading = "lazy";
      img.dataset.src = item.src;
      img.onerror = function () {
        this.src = "/assets/images/placeholder.svg";
        this.classList.add("error");
      };
      itemElement.appendChild(img);

      const title = document.createElement("p");
      title.className = "work-feed__title";
      title.textContent = item.title || "";

      const desc = document.createElement("p");
      desc.className = "work-feed__desc";
      desc.textContent = item.description || "";

      const itemWrapper = document.createElement("div");
      itemWrapper.className = "work-feed__group";
      itemWrapper.appendChild(itemElement);
      itemWrapper.appendChild(title);
      itemWrapper.appendChild(desc);
      rowElement.appendChild(itemWrapper);
      imageObserver.observe(img);
    });
    workGrid.appendChild(rowElement);
  };

  if (workFeedState.currentPage === 1) {
    workGrid.innerHTML = "";
    workGrid.classList.add("loading");
    rowsToShow.forEach(appendRow);
    workFeedState.lastRenderedRowCount = rowsToShow.length;
    setTimeout(() => {
      workGrid.classList.remove("loading");
    }, 100);
  } else {
    const startIndex = workFeedState.lastRenderedRowCount;
    const endIndex = workFeedState.currentPage * workFeedState.pageSize;
    const newRows = rows.slice(startIndex, endIndex);
    newRows.forEach(appendRow);
    workFeedState.lastRenderedRowCount = endIndex;
  }
  let sentinel = document.getElementById("load-more-sentinel");
  if (!sentinel) {
    sentinel = document.createElement("div");
    sentinel.id = "load-more-sentinel";
    sentinel.style.width = "100%";
    sentinel.style.height = "var(--size-1)";
    sentinel.style.pointerEvents = "none";
    sentinel.style.background = "transparent";
    document.querySelector(".work-feed").insertAdjacentElement("afterend", sentinel);
  } else {
    document.querySelector(".work-feed").insertAdjacentElement("afterend", sentinel);
  }
  setupLoadMoreObserver();
}

function setupLoadMoreObserver() {
  if (loadMoreObserver) {
    loadMoreObserver.disconnect();
    loadMoreObserver = null;
  }
  const sentinel = document.getElementById("load-more-sentinel");
  if (!sentinel) return;
  loadMoreObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        loadMoreObserver.disconnect();
        loadMoreObserver = null;
        if (workFeedState.currentPage * workFeedState.pageSize < workFeedState.allRows.length) {
          workFeedState.currentPage++;
          renderWorkFeed();
        }
      }
    },
    {
      rootMargin: "0px",
      threshold: 0.1,
    }
  );
  loadMoreObserver.observe(sentinel);
}

async function initializeWorkSlideshow() {
  const container = document.querySelector(".work-slideshow");
  if (!container) return;

  try {
    const response = await fetch("/assets/images/work/work-manifest.json");
    if (!response.ok) return;

    const workItems = await response.json();
    const items = workItems.map((item) => {
      const src = `/assets/images/work/${item.file}`;
      const isLandscape = item.file.includes("-landscape-");
      return { src, isLandscape };
    });
    const shuffled = shuffleArray(items);
    const rows = [];

    for (let i = 0; i < shuffled.length; i++) {
      const it = shuffled[i];
      if (it.isLandscape) {
        rows.push({ type: "landscape", items: [it] });
      } else if (i + 1 < shuffled.length && !shuffled[i + 1].isLandscape) {
        rows.push({ type: "square", items: [it, shuffled[i + 1]] });
        i++;
      }
    }

    const slideRows = rows.slice(0, 10);
    const slideEls = slideRows.map((row) => {
      const rowEl = document.createElement("div");
      rowEl.className = `image__row ${row.type}`;
      row.items.forEach((item) => {
        const itemEl = document.createElement("div");
        itemEl.className = "image__item loading";
        const img = document.createElement("img");
        img.alt = "Work";
        img.dataset.src = item.src;
        img.onerror = () => {
          img.src = "/assets/images/placeholder.svg";
          img.classList.add("error");
        };
        img.onload = () => {
          img.classList.add("loaded");
          itemEl.classList.remove("loading");
        };
        itemEl.appendChild(img);
        rowEl.appendChild(itemEl);
      });
      return rowEl;
    });

    let idx = 0;
    container.innerHTML = "";
    container.appendChild(slideEls[0]);

    function loadSlideImages(slideEl) {
      slideEl.querySelectorAll("img").forEach((img) => {
        if (!img.src) img.src = img.dataset.src;
      });
    }

    loadSlideImages(slideEls[0]);

    const preloadSlides = [1, 2, 3].filter((i) => i < slideEls.length);
    const preloadPromises = preloadSlides.map((i) => {
      const imgs = Array.from(slideEls[i].querySelectorAll("img"));
      return Promise.all(
        imgs.map(
          (img) =>
            new Promise((resolve) => {
              img.addEventListener("load", resolve);
              img.addEventListener("error", resolve);
              img.src = img.dataset.src;
            })
        )
      );
    });
    Promise.all(preloadPromises).then(() => {
      container.innerHTML = "";
      container.appendChild(slideEls[0]);
      slideshowInterval = setInterval(() => {
        idx = (idx + 1) % slideEls.length;
        loadSlideImages(slideEls[idx]);
        container.innerHTML = "";
        container.appendChild(slideEls[idx]);
      }, 1000);
    });

    setTimeout(() => {
      slideEls.slice(4).forEach(loadSlideImages);
    }, 500);
  } catch {}
}
