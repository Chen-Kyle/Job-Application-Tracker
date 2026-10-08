// Popup controller and job-listing extraction.
// See scripts/README.md for page entry points and dependency order.
const form = document.querySelector("#job-form");
const role = document.querySelector("#role");
const company = document.querySelector("#company");
const url = document.querySelector("#url");
const save = document.querySelector("#save");
const message = document.querySelector("#message");

// Runs only in the page the user opens the extension on.
function extractJob() {
  const postings = [];
  function visit(value) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    const types = [].concat(value["@type"] || []);
    if (types.includes("JobPosting")) postings.push(value);
    Object.values(value).forEach(visit);
  }
  for (const script of document.querySelectorAll(
    'script[type="application/ld+json"]',
  )) {
    try {
      visit(JSON.parse(script.textContent));
    } catch {
      /* Ignore malformed metadata. */
    }
  }
  const job = postings[0];
  const clean = (value) => (typeof value === "string" ? value.trim() : "");
  if (/(^|\.)joinhandshake\.com$/i.test(location.hostname)) {
    const selectedId = location.pathname.match(
      /\/(?:job-search|jobs)\/(\d+)(?:\/|$)/,
    )?.[1];
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        !element.closest('[hidden], [aria-hidden="true"]')
      );
    };
    const employers = [...document.querySelectorAll("a[href]")].filter(
      (link) => {
        try {
          const target = new URL(link.href, location.href);
          return (
            /(^|\.)joinhandshake\.com$/i.test(target.hostname) &&
            /^\/(?:e|employers)\/\d+(?:\/|$)/.test(target.pathname) &&
            clean(link.textContent) &&
            visible(link)
          );
        } catch {
          return false;
        }
      },
    );
    const headings = [
      ...document.querySelectorAll(
        'h1, h2, h3, [role="heading"], [data-testid*="job-title"], [data-test*="job-title"]',
      ),
    ].filter(
      (element) =>
        visible(element) &&
        clean(element.textContent) &&
        !/^(jobs|search|saved|summary|at a glance|about|description)$/i.test(
          clean(element.textContent),
        ),
    );
    const pairs = [];
    const employerName = (link) =>
      clean(
        (link.innerText || link.textContent || "")
          .split(/\r?\n/)
          .map(clean)
          .find(Boolean),
      );
    const profileKey = (link) => {
      const target = new URL(link.href, location.href);
      return `${target.origin}${target.pathname.replace(/\/$/, "")}`;
    };
    for (const heading of headings) {
      const rect = heading.getBoundingClientRect();
      for (const employer of employers) {
        const anchor = employer.getBoundingClientRect();
        const gap = rect.top - anchor.bottom;
        // The employer link precedes the title in the selected detail panel.
        // Avoid unrelated employer cards in the neighboring results column.
        const overlap =
          Math.min(rect.right, anchor.right) - Math.max(rect.left, anchor.left);
        if (
          overlap <= 0 ||
          gap < -8 ||
          gap > 260 ||
          !(employer.compareDocumentPosition(heading) & 4)
        )
          continue;
        // Handshake can link both the company name and its industry to the same
        // profile. Prefer the first text link in this panel, not the nearest one.
        const earlierName = employers.some((other) => {
          if (other === employer || profileKey(other) !== profileKey(employer))
            return false;
          const otherRect = other.getBoundingClientRect();
          const otherGap = rect.top - otherRect.bottom;
          const otherOverlap =
            Math.min(rect.right, otherRect.right) -
            Math.max(rect.left, otherRect.left);
          return (
            otherRect.top < anchor.top &&
            otherGap >= -8 &&
            otherGap <= 260 &&
            otherOverlap > 0 &&
            other.compareDocumentPosition(heading) & 4
          );
        });
        if (earlierName) continue;
        const level =
          heading.tagName === "H1" ? 300 : heading.tagName === "H2" ? 180 : 80;
        pairs.push({
          heading,
          employer,
          score: level - gap - Math.abs(rect.left - anchor.left) / 4,
        });
      }
    }
    pairs.sort((a, b) => b.score - a.score);
    const selected = pairs[0];
    const metadata =
      postings.find(
        (posting) =>
          String(posting.identifier?.value || posting.identifier || "") ===
          selectedId,
      ) || (postings.length === 1 ? job : null);
    return {
      role: clean(selected?.heading.textContent) || clean(metadata?.title),
      company:
        (selected ? employerName(selected.employer) : "") ||
        clean(metadata?.hiringOrganization?.name),
      // Remove search/filter parameters so the same listing is not saved twice.
      url: selectedId
        ? `${location.origin}${location.pathname}`
        : location.href,
    };
  }
  function companyFromIntroduction(text) {
    const intro = clean(text)
      .replace(/[®™]/g, "")
      .replace(/\[\d+\]/g, "")
      .replace(/\s+/g, " ");
    // Prefer a named organization at the start, before a ticker or description.
    const name = (
      intro.match(/^At\s+(.{2,120}?),\s+we\b/i)?.[1] ||
      intro.match(
        /^(.{2,120}?)(?=\s*\(|,\s+(?:a|an|the)\b|\s+(?:is|has|provides|offers|specializes in|was founded|was established)\b)/i,
      )?.[1]
    )?.trim();
    if (
      !name ||
      /^(?:we|our|us|you|your|they|their|it|the (?:company|team|role|position|organization|employer)|this|at|join|about|as|with|founded|established)\b/i.test(
        name,
      ) ||
      name.split(/\s+/).length > 14 ||
      /[!?;:\n]/.test(name)
    )
      return "";
    return name;
  }
  function companyFromAboutSection() {
    const sectionLabel =
      /^(?:about (?:the company|us|the employer|our (?:company|organization))|(?:company|employer|organization) (?:overview|profile)|who we are|our (?:organization|company|story)|meet (?:the|your) employer)\s*[:.]?$/i;
    // Named "About ..." headings are useful context, but never enough evidence
    // by themselves: require a named organization in the following paragraph.
    const isCompanyHeading = (text) =>
      sectionLabel.test(text) ||
      (/^about\s+.{2,80}\s*[:.]?$/i.test(text) &&
        !/^about\s+(?:the |this |your |our )?(?:role|job|position|team|benefits|department|application|opportunity)\b/i.test(
          text,
        ));
    const labels = [
      ...document.querySelectorAll(
        'h1, h2, h3, h4, h5, h6, strong, b, [role="heading"]',
      ),
    ].filter((element) => isCompanyHeading(clean(element.textContent)));
    for (const label of labels) {
      if (label.closest('[hidden], [aria-hidden="true"]')) continue;
      for (
        let node = label, depth = 0;
        node && depth < 3;
        node = node.parentElement, depth++
      ) {
        let next = node.nextElementSibling;
        for (
          let attempts = 0;
          next && attempts < 3;
          next = next.nextElementSibling, attempts++
        ) {
          const text = clean(next.innerText || next.textContent);
          if (!text) continue;
          const name = companyFromIntroduction(text);
          if (name) return name;
          break;
        }
      }
    }
    // Some editors nest the section label and paragraphs in a single container.
    const bodyText = document.body?.innerText || "";
    const lines = bodyText.split(/\r?\n/).map(clean).filter(Boolean);
    for (let index = 0; index < lines.length - 1; index++) {
      if (!isCompanyHeading(lines[index])) continue;
      const name = companyFromIntroduction(lines[index + 1]);
      if (name) return name;
    }
    return "";
  }
  function companyFromPageTitle() {
    const title =
      clean(document.querySelector('meta[property="og:title"]')?.content) ||
      clean(document.title);
    const name = title
      .match(/^Job Application for .+ at (.{2,120})$/i)?.[1]
      ?.trim();
    return name &&
      !/^(?:greenhouse|dayforce|handshake|workday)(?:\s+(?:jobs|hcm))?$/i.test(
        name,
      )
      ? name
      : "";
  }
  const siteName = clean(
    document.querySelector('meta[property="og:site_name"]')?.content,
  );
  return {
    role:
      clean(job?.title) ||
      clean(document.querySelector("h1")?.textContent) ||
      document.title,
    company:
      clean(job?.hiringOrganization?.name) ||
      companyFromAboutSection() ||
      companyFromPageTitle() ||
      (/^(?:dayforce|greenhouse|handshake|workday)(?:\s+(?:jobs|hcm))*$/i.test(
        siteName,
      )
        ? ""
        : siteName),
    url: location.href,
  };
}

function validUrl(value) {
  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

async function renderJobs() {
  const jobs = await JobStore.list();
  document.querySelector("#count").textContent = jobs.length;
  document.querySelector("#empty").hidden = jobs.length > 0;
  const list = document.querySelector("#jobs");
  list.replaceChildren();
  for (const job of [...jobs].reverse()) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.textContent = job.role;
    if (validUrl(job.url)) {
      const destination = new URL(job.url);
      link.href = destination.href;
      link.title = destination.href;

    }
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const details = document.createElement("div");
    details.className = "details";
    details.textContent = `${job.company || "Company not specified"} · Saved ${new Date(job.savedAt).toLocaleDateString()}`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-job";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove saved job: ${job.role}`);
    remove.addEventListener("click", async () => {
      remove.disabled = true;
      try {
        await JobStore.remove(job.id);
        await renderJobs();
        message.textContent = "Job removed. Use Undo application deletion to restore it.";
      } catch {
        remove.disabled = false;
        message.textContent = "Could not remove the job. Please try again.";
      }
    });
    item.append(link, details, remove);
    list.append(item);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!role.value.trim() || !validUrl(url.value.trim())) {
    message.textContent = "Enter a role and a valid http or https job link.";
    return;
  }
  save.disabled = true;
  try {
    const jobUrl = new URL(url.value.trim());
    jobUrl.hash = "";
    const added = await JobStore.add({
      id: crypto.randomUUID(),
      role: role.value.trim(),
      company: company.value.trim(),
      url: jobUrl.href,
      savedAt: new Date().toISOString(),
    });
    if (!added) {
      message.textContent = "This job link is already saved.";
      return;
    }
    await renderJobs();
    message.textContent = "Job saved!";
  } catch {
    message.textContent = "Could not save the job. Please try again.";
  } finally {
    save.disabled = false;
  }
});

async function initialize() {
  try {
    await renderJobs();
  } catch {
    message.textContent = "Could not load saved jobs.";
  }
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab || !validUrl(tab.url)) throw new Error("Unsupported page");
    url.value = tab.url;
    role.value = tab.title || "";
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractJob,
    });
    role.value = result.result.role;
    company.value = result.result.company;
    url.value = result.result.url;
    if ((await JobStore.list()).some(job => JobStore.listingKey(job.url) === JobStore.listingKey(url.value)))
      message.textContent = "This listing is already tracked. Saving it again will not create a duplicate.";
  } catch {
    message.textContent =
      "Page details unavailable. You can enter the job details manually.";
  } finally {
    save.disabled = false;
    save.textContent = "Save job";
  }
}
initialize();
document.querySelector("#dashboard").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.jobs) {
    renderJobs().catch(() => {
      message.textContent = "Could not refresh saved jobs.";
    });
  }
});
