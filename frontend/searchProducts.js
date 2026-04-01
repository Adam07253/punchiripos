function setupProductSearch({
  inputId,
  suggestId,
  products,
  onSelect,
  showRight = p => `₹${p.retail_price}`
}) {
  const input = document.getElementById(inputId);
  const box = document.getElementById(suggestId);
  if (!input || !box) {
  console.error("Invalid inputId or suggestId");
  return;
}

products = Array.isArray(products) ? products : [];
  let matches = [];
  let index = -1;

  input.addEventListener("input", () => build(input.value));
  input.addEventListener("keydown", handleKeys);

  function build(q) {
    box.innerHTML = "";
    box.style.display = "none";
    index = -1;

    if (!q.trim()) return;

    const ql = q.toLowerCase();

    const starts = [];
    const contains = [];

    products.forEach(p => {
      if (!p.name) return;
      const n = p.name.toLowerCase();
      if (n.startsWith(ql)) starts.push(p);
      else if (n.includes(ql)) contains.push(p);
    });

    matches = [...starts, ...contains].slice(0, 30);
    if (!matches.length) return;

    matches.forEach((p, i) => {
      const row = document.createElement("div");
      row.className = "sitem";
      let rightText = "";

try {
  rightText = showRight(p);
} catch {
  rightText = "";
}

row.innerHTML = `
  <div class="suggest-line">
    ${p.name} — ${rightText}
  </div>
`;
      row.onclick = () => select(i);
      box.appendChild(row);
    });

    box.style.display = "block";
  }

  function handleKeys(e) {
    if (box.style.display !== "block") return;

    const items = box.querySelectorAll(".sitem");

    if (e.key === "ArrowDown") {
      e.preventDefault();
      index = Math.min(index + 1, items.length - 1);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      index = Math.max(index - 1, 0);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      select(index < 0 ? 0 : index);
    }

    items.forEach((el, i) => {
  el.classList.toggle("active", i === index);

  // ✅ Scroll the active item into view
  if (i === index) {
    el.scrollIntoView({
      block: "nearest"
    });
  }
});
  }

  function select(i) {
    if (!matches[i]) return;
    box.style.display = "none";
    input.value = matches[i].name;
    onSelect(matches[i]);
  }
}