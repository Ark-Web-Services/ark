function initializeArticleContents() {
  const container = document.getElementById("toc-list");
  const article = document.querySelector(".article__body");
  if (!container || !article || container.children.length) return;
  const headings = article.querySelectorAll<HTMLElement>("h2, h3");
  if (!headings.length) { const nav = container.closest<HTMLElement>("nav"); if (nav) nav.hidden = true; return; }
  const list = document.createElement("ol");
  list.className = "toc__list";
  headings.forEach((heading, index) => {
    if (!heading.id) heading.id = (heading.textContent || "section").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + `-${index}`;
    const item = document.createElement("li");
    item.className = `toc__item toc__item--${heading.tagName.toLowerCase()}`;
    const link = document.createElement("a");
    link.className = "toc__link";
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent || "Section";
    item.appendChild(link);
    list.appendChild(item);
  });
  container.appendChild(list);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeArticleContents, { once: true });
else initializeArticleContents();
