const INSTAGRAM_URL = "https://www.instagram.com/usejoliie/";
const WHATSAPP_NUMBER = "559180880527";
const CART_STORAGE_KEY = "jolie_cart";

const q = (selector, root = document) => root.querySelector(selector);
const qa = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = (value) => Number(value).toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const CATEGORY_LABELS = {
  conjuntos: "Conjuntos",
  tops: "Tops",
  regatas: "Regatas",
  vestidos: "Vestidos",
  shorts: "Shorts",
};

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  if (!value) return [];
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

function installmentText(product) {
  const count = Math.max(1, Number.parseInt(product.installments, 10) || 1);
  if (count <= 1) return "";
  const installment = Number(product.price || 0) / count;
  return `${count}x de ${money(installment)}${product.interestFree !== false ? " sem juros" : ""}`;
}

function productDetails(product) {
  if (product.description) return String(product.description);
  const bits = [];
  if (product.variant) bits.push(product.variant);
  const colors = normalizeList(product.colors);
  const sizes = normalizeList(product.sizes);
  if (colors.length) bits.push(colors.join(" · "));
  if (sizes.length) bits.push(`Tamanhos ${sizes.join(", ")}`);
  return bits.join(" · ");
}

function productBadge(product) {
  if (product.status === "soldout") return { text: "", tone: "dark" };
  const configured = product.badge && typeof product.badge === "object" ? product.badge : {};
  if (product.launch) return { text: configured.text || "Lançamento", tone: configured.tone || "pink" };
  if (product.isNew && !configured.text) return { text: "Novo", tone: "pink" };
  return { text: configured.text || "", tone: configured.tone || "pink" };
}

function sortProducts(products) {
  return [...products].sort((a, b) => {
    const launchDiff = Number(Boolean(b.launch)) - Number(Boolean(a.launch));
    if (launchDiff) return launchDiff;
    const orderDiff = (Number(a.order) || 9999) - (Number(b.order) || 9999);
    if (orderDiff) return orderDiff;
    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });
}

function renderCatalog() {
  if (!elements.productGrid) return;
  const source = Array.isArray(window.JOLIE_PRODUCTS) ? window.JOLIE_PRODUCTS : [];
  const products = sortProducts(source.filter((product) => product && product.status !== "hidden"));
  elements.productGrid.replaceChildren();

  if (!products.length) {
    const empty = document.createElement("p");
    empty.className = "catalog-loading";
    empty.textContent = "Nenhuma peça disponível no momento.";
    elements.productGrid.appendChild(empty);
    if (elements.visibleCount) elements.visibleCount.textContent = "0 peças";
    return;
  }

  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.dataset.category = product.category || "outros";
    card.dataset.name = product.name || "Produto";
    card.dataset.launch = String(Boolean(product.launch));
    card.dataset.meta = [product.variant, product.description, ...normalizeList(product.colors), ...normalizeList(product.sizes)].filter(Boolean).join(" ");

    const soldOut = product.status === "soldout";
    if (soldOut) card.classList.add("is-sold-out");

    const media = document.createElement("div");
    media.className = "product-image-wrap";

    const badgeData = productBadge(product);
    if (badgeData.text) {
      const badge = document.createElement("span");
      badge.className = "badge";
      if (badgeData.tone === "soft") badge.classList.add("badge-soft");
      if (badgeData.tone === "dark") badge.classList.add("badge-dark");
      badge.textContent = badgeData.text;
      media.appendChild(badge);
    }

    const heart = document.createElement("button");
    heart.className = "heart";
    heart.type = "button";
    heart.setAttribute("aria-label", `Favoritar ${product.name || "produto"}${product.variant ? `, ${product.variant}` : ""}`);
    heart.setAttribute("aria-pressed", "false");
    heart.textContent = "♡";

    const image = document.createElement("img");
    image.src = product.image || "";
    image.alt = product.imageAlt || `${product.name || "Produto"} da Use Jolie`;
    image.loading = "lazy";
    image.decoding = "async";
    if (Number(product.imageWidth) > 0) image.width = Number(product.imageWidth);
    if (Number(product.imageHeight) > 0) image.height = Number(product.imageHeight);

    const add = document.createElement("button");
    add.className = "quick-add";
    add.type = "button";
    add.dataset.price = String(Number(product.price || 0));
    add.dataset.product = product.name || "Produto";
    add.dataset.variant = product.variant || "";
    add.disabled = soldOut;
    add.setAttribute("aria-disabled", String(soldOut));
    add.textContent = soldOut ? "Indisponível para compra" : "Adicionar à sacola ＋";

    media.append(heart, image);

    if (soldOut) {
      const soldOutLayer = document.createElement("div");
      soldOutLayer.className = "sold-out-layer";
      soldOutLayer.setAttribute("aria-label", "Produto esgotado e indisponível para compra no momento");

      const soldOutTitle = document.createElement("strong");
      soldOutTitle.textContent = "Esgotado";
      const soldOutText = document.createElement("span");
      soldOutText.textContent = "Indisponível para compra no momento";
      soldOutLayer.append(soldOutTitle, soldOutText);
      media.appendChild(soldOutLayer);
    }

    media.appendChild(add);

    const info = document.createElement("div");
    info.className = "product-info";
    const category = document.createElement("span");
    category.textContent = product.categoryLabel || CATEGORY_LABELS[product.category] || product.category || "Coleção";
    const name = document.createElement("h3");
    name.textContent = product.name || "Produto";
    const price = document.createElement("strong");
    price.textContent = money(product.price || 0);
    info.append(category, name, price);

    const installment = installmentText(product);
    if (installment) {
      const small = document.createElement("small");
      small.className = "installment";
      small.textContent = installment;
      info.appendChild(small);
    }

    if (soldOut) {
      const unavailable = document.createElement("span");
      unavailable.className = "sold-out-note";
      unavailable.textContent = "Indisponível para compra no momento";
      info.appendChild(unavailable);
    }

    const details = productDetails(product);
    if (details) {
      const description = document.createElement("p");
      description.textContent = details;
      info.appendChild(description);
    }

    card.append(media, info);
    elements.productGrid.appendChild(card);
  });

  syncCategoryFilters(products);
}

function syncCategoryFilters(products) {
  if (!elements.filters) return;
  const existing = new Set(qa(".filter", elements.filters).map((button) => button.dataset.filter));
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))];
  categories.forEach((category) => {
    if (existing.has(category)) return;
    const button = document.createElement("button");
    button.className = "filter";
    button.type = "button";
    button.dataset.filter = category;
    button.setAttribute("aria-pressed", "false");
    const sample = products.find((product) => product.category === category);
    button.textContent = sample?.categoryLabel || CATEGORY_LABELS[category] || category;
    elements.filters.appendChild(button);
  });
}

const elements = {
  overlay: q("#overlay"),
  cartDrawer: q("#cartDrawer"),
  searchModal: q("#searchModal"),
  mobileMenu: q("#mobileMenu"),
  productGrid: q("#productGrid"),
  filters: q(".filters"),
  visibleCount: q("#visibleCount"),
  searchInput: q("#searchInput"),
  searchResults: q("#searchResults"),
  cartItems: q("#cartItems"),
  cartEmpty: q("#cartEmpty"),
  cartFooter: q("#cartFooter"),
  cartCount: q("#cartCount"),
  drawerCount: q("#drawerCount"),
  cartTotal: q("#cartTotal"),
};

const layerConfig = new Map([
  [elements.cartDrawer, q("#cartOpen")],
  [elements.searchModal, q("#searchOpen")],
  [elements.mobileMenu, q("#menuOpen")],
]);

let activeLayer = null;
let previousFocus = null;
let cart = loadCart();

function loadCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    if (!Array.isArray(stored)) return [];

    return stored
      .filter((item) => item && typeof item.name === "string" && Number.isFinite(Number(item.price)))
      .map((item) => ({
        name: item.name,
        price: Number(item.price),
        variant: typeof item.variant === "string" ? item.variant : "",
        qty: Math.max(1, Number.parseInt(item.qty, 10) || 1),
      }));
  } catch {
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // O carrinho continua funcionando em memória quando o storage está indisponível.
  }
  renderCart();
}

function keepLaunchesFirst() {
  if (!elements.productGrid) return;

  const cards = qa(".product-card", elements.productGrid);
  cards
    .sort((a, b) => Number(b.dataset.launch === "true") - Number(a.dataset.launch === "true"))
    .forEach((card) => elements.productGrid.appendChild(card));
}

function getCatalog() {
  return qa(".product-card", elements.productGrid).map((card) => {
    const quickAdd = q(".quick-add", card);
    return {
      name: card.dataset.name || "Produto",
      category: card.dataset.category || "",
      categoryLabel: q(".product-info > span", card)?.textContent.trim() || "",
      price: Number(quickAdd?.dataset.price || 0),
      variant: quickAdd?.dataset.variant || "",
      launch: card.dataset.launch === "true",
      meta: card.dataset.meta || "",
    };
  });
}

function setTriggerExpanded(layer, expanded) {
  const trigger = layerConfig.get(layer);
  if (trigger) trigger.setAttribute("aria-expanded", String(expanded));
}

function hideLayer(layer) {
  if (!layer) return;
  layer.classList.remove("open");
  layer.setAttribute("aria-hidden", "true");
  setTriggerExpanded(layer, false);
}

function openLayer(layer, { focusTarget, returnFocus } = {}) {
  if (!layer) return;

  previousFocus = returnFocus || (document.activeElement instanceof HTMLElement ? document.activeElement : null);

  [elements.cartDrawer, elements.searchModal, elements.mobileMenu].forEach((candidate) => {
    if (candidate !== layer) hideLayer(candidate);
  });

  activeLayer = layer;
  layer.classList.add("open");
  layer.setAttribute("aria-hidden", "false");
  setTriggerExpanded(layer, true);
  elements.overlay?.classList.add("show");
  document.body.classList.add("is-locked");

  requestAnimationFrame(() => {
    const target = focusTarget || getFocusable(layer)[0] || layer;
    target?.focus({ preventScroll: true });
  });
}

function closeLayers({ restoreFocus = true } = {}) {
  [elements.cartDrawer, elements.searchModal, elements.mobileMenu].forEach(hideLayer);
  elements.overlay?.classList.remove("show");
  document.body.classList.remove("is-locked");
  activeLayer = null;

  if (restoreFocus && previousFocus?.isConnected) {
    previousFocus.focus({ preventScroll: true });
  }
  previousFocus = null;
}

function getFocusable(root) {
  if (!root) return [];
  return qa(
    'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    root,
  ).filter((element) => !element.hasAttribute("hidden") && element.offsetParent !== null);
}

function trapFocus(event) {
  if (event.key !== "Tab" || !activeLayer) return;

  const focusable = getFocusable(activeLayer);
  if (!focusable.length) {
    event.preventDefault();
    activeLayer.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function openSearch() {
  if (!elements.searchModal) return;
  renderSearch("");
  openLayer(elements.searchModal, { focusTarget: elements.searchInput });
}

function renderSearch(term) {
  if (!elements.searchResults) return;

  const normalized = term.trim().toLocaleLowerCase("pt-BR");
  const catalog = getCatalog();
  const found = catalog.filter((product) => {
    const haystack = `${product.name} ${product.variant} ${product.category} ${product.categoryLabel} ${product.meta || ""}`.toLocaleLowerCase("pt-BR");
    return haystack.includes(normalized);
  });

  elements.searchResults.replaceChildren();

  if (!found.length) {
    const empty = document.createElement("div");
    empty.className = "search-empty";
    empty.textContent = "Nenhuma peça encontrada. Veja o drop completo no Instagram.";
    elements.searchResults.appendChild(empty);
    return;
  }

  found.forEach((product) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result";
    button.dataset.product = product.name;
    button.dataset.price = String(product.price);
    button.dataset.variant = product.variant;

    const info = document.createElement("div");
    const name = document.createElement("strong");
    const meta = document.createElement("small");
    const price = document.createElement("span");

    name.textContent = product.name;
    meta.textContent = [product.variant, product.categoryLabel].filter(Boolean).join(" · ");
    price.textContent = money(product.price);

    info.append(name, document.createElement("br"), meta);
    button.append(info, price);
    elements.searchResults.appendChild(button);
  });
}

function setFilter(filter) {
  const buttons = qa(".filter", elements.filters);
  buttons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  let count = 0;
  qa(".product-card", elements.productGrid).forEach((card) => {
    const show = filter === "all" || card.dataset.category === filter;
    card.classList.toggle("hidden", !show);
    if (show) count += 1;
  });

  if (elements.visibleCount) {
    elements.visibleCount.textContent = `${count} ${count === 1 ? "peça" : "peças"}`;
  }
}

function toggleFavorite(button) {
  const isFavorite = !button.classList.contains("is-favorite");
  button.classList.toggle("is-favorite", isFavorite);
  button.setAttribute("aria-pressed", String(isFavorite));
  button.textContent = isFavorite ? "♥" : "♡";
}

function addToCart(name, price, variant = "") {
  const existing = cart.find((item) => item.name === name && item.variant === variant);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, variant, qty: 1 });
  }

  saveCart();
}

function removeFromCart(index) {
  const item = cart[index];
  if (!item) return;

  if (item.qty > 1) {
    item.qty -= 1;
  } else {
    cart.splice(index, 1);
  }

  saveCart();
}

function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  if (elements.cartCount) elements.cartCount.textContent = String(count);
  if (elements.drawerCount) elements.drawerCount.textContent = String(count).padStart(2, "0");
  if (elements.cartTotal) elements.cartTotal.textContent = money(total);
  if (elements.cartEmpty) elements.cartEmpty.hidden = count > 0;
  if (elements.cartFooter) elements.cartFooter.hidden = count === 0;
  if (!elements.cartItems) return;

  elements.cartItems.replaceChildren();

  cart.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "cart-item";

    const info = document.createElement("div");
    const title = document.createElement("h4");
    const details = document.createElement("p");
    const remove = document.createElement("button");

    title.textContent = item.name;
    details.textContent = `${item.variant ? `${item.variant} · ` : ""}${item.qty} × ${money(item.price)} · ${money(item.qty * item.price)}`;
    remove.type = "button";
    remove.dataset.cartIndex = String(index);
    remove.textContent = item.qty > 1 ? "remover 1" : "remover";
    remove.setAttribute("aria-label", `Remover ${item.name}${item.variant ? `, ${item.variant}` : ""} da sacola`);

    info.append(title, details);
    row.append(info, remove);
    elements.cartItems.appendChild(row);
  });
}

function orderText() {
  const lines = cart.map((item) => (
    `• ${item.qty}x ${item.name}${item.variant ? ` (${item.variant})` : ""} | ${money(item.qty * item.price)}`
  ));
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return [
    "Oi, Jolie! 💗 Vi as peças no site e gostaria de confirmar disponibilidade:",
    "",
    ...lines,
    "",
    `Total estimado: ${money(total)}`,
    "",
    "Pode me ajudar com tamanhos/cores e entrega ou retirada?",
  ].join("\n");
}

function goWhatsapp(withCart = false) {
  if (!WHATSAPP_NUMBER) {
    window.open(INSTAGRAM_URL, "_blank", "noopener,noreferrer");
    return;
  }

  const text = withCart && cart.length
    ? orderText()
    : "Oi, Jolie! 💗 Vim pelo site e gostaria de ver as peças disponíveis.";

  window.open(
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`,
    "_blank",
    "noopener,noreferrer",
  );
}

function flashAddButton(button) {
  const original = button.textContent;
  button.textContent = "Adicionado ✓";
  button.disabled = true;

  window.setTimeout(() => {
    button.textContent = original;
    button.disabled = false;
  }, 1000);
}

function bindEvents() {
  q("#cartOpen")?.addEventListener("click", () => openLayer(elements.cartDrawer));
  q("#cartClose")?.addEventListener("click", () => closeLayers());
  q("#menuOpen")?.addEventListener("click", () => openLayer(elements.mobileMenu));
  q("#menuClose")?.addEventListener("click", () => closeLayers());
  q("#searchOpen")?.addEventListener("click", openSearch);
  q("#searchInline")?.addEventListener("click", openSearch);
  q("#searchClose")?.addEventListener("click", () => closeLayers());
  elements.overlay?.addEventListener("click", () => closeLayers());

  q("#emptyShopLink")?.addEventListener("click", () => closeLayers({ restoreFocus: false }));
  qa("#mobileMenu a").forEach((link) => link.addEventListener("click", () => closeLayers({ restoreFocus: false })));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeLayer) {
      closeLayers();
      return;
    }
    trapFocus(event);
  });

  elements.searchInput?.addEventListener("input", (event) => renderSearch(event.target.value));

  elements.searchResults?.addEventListener("click", (event) => {
    const button = event.target.closest(".search-result");
    if (!button) return;

    addToCart(button.dataset.product, Number(button.dataset.price), button.dataset.variant || "");
    closeLayers({ restoreFocus: false });
    openLayer(elements.cartDrawer, { returnFocus: q("#cartOpen") });
  });

  elements.filters?.addEventListener("click", (event) => {
    const button = event.target.closest(".filter");
    if (!button) return;
    setFilter(button.dataset.filter || "all");
  });

  elements.productGrid?.addEventListener("click", (event) => {
    const heart = event.target.closest(".heart");
    if (heart) {
      toggleFavorite(heart);
      return;
    }

    const quickAdd = event.target.closest(".quick-add");
    if (!quickAdd) return;

    addToCart(
      quickAdd.dataset.product,
      Number(quickAdd.dataset.price),
      quickAdd.dataset.variant || "",
    );
    flashAddButton(quickAdd);
  });

  elements.cartItems?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cart-index]");
    if (!button) return;
    removeFromCart(Number(button.dataset.cartIndex));
  });

  q("#whatsappButton")?.addEventListener("click", () => goWhatsapp(false));
  q("#footerWhatsapp")?.addEventListener("click", () => goWhatsapp(false));
  q("#checkoutButton")?.addEventListener("click", () => goWhatsapp(true));
}

function init() {
  renderCatalog();
  keepLaunchesFirst();
  setFilter("all");
  renderCart();
  bindEvents();
}

window.addEventListener("jolie:products-loaded", () => {
  renderCatalog();
  keepLaunchesFirst();
  setFilter("all");
});

init();
