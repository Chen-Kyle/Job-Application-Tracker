// Keyboard-accessible email autocomplete backed by saved contacts and an account-scoped Gmail cache.
globalThis.RecruiterAutocomplete = (() => {
  function merge(saved, recent, ownEmail = "") {
    const byEmail = new Map();
    for (const contact of [...saved, ...recent]) {
      const email = String(contact.email || "").toLowerCase();
      if (!RecruiterData.email(email) || email === ownEmail.toLowerCase())
        continue;
      if (!byEmail.has(email))
        byEmail.set(email, {
          email,
          name: contact.name || "",
          source: contact.source || "Saved recruiter",
        });
    }
    return [...byEmail.values()];
  }
  function attach(email, name, job, active) {
    const list = document.createElement("div");
    list.id = "recruiter-email-suggestions";
    list.className = "recruiter-suggestions";
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-label", "Recruiter email suggestions");
    list.hidden = true;
    email.setAttribute("role", "combobox");
    email.setAttribute("aria-autocomplete", "list");
    email.setAttribute("aria-controls", list.id);
    email.setAttribute("aria-expanded", "false");
    email.autocomplete = "off";
    let choices = merge(
      (globalThis.demo ? samples : jobs).flatMap(
        (item) => item.recruiterContacts || [],
      ),
      [],
    );
    let filtered = [];
    let selectedIndex = -1;
    const close = () => {
      list.hidden = true;
      selectedIndex = -1;
      email.setAttribute("aria-expanded", "false");
      email.removeAttribute("aria-activedescendant");
    };
    const highlight = (index) => {
      selectedIndex = index;
      Array.from(list.children).forEach((option, i) => {
        option.setAttribute("aria-selected", String(i === index));
      });
      if (index >= 0) {
        email.setAttribute("aria-activedescendant", list.children[index].id);
        list.children[index].scrollIntoView({ block: "nearest" });
      }
    };
    const choose = (index) => {
      const contact = filtered[index];
      if (!contact) return;
      email.value = contact.email;
      if (contact.name) name.value = contact.name;
      close();
    };
    const update = () => {
      const query = email.value.trim().toLowerCase();
      filtered = choices.filter((item) =>
        item.email.includes(query) || item.name.toLowerCase().includes(query),
      ).slice(0, 20);
      selectedIndex = -1;
      email.removeAttribute("aria-activedescendant");
      list.replaceChildren();
      filtered.forEach((contact, index) => {
        const option = document.createElement("div");
        option.id = `${list.id}-${index}`;
        option.className = "recruiter-suggestion";
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", "false");
        const title = document.createElement("strong");
        title.textContent = contact.name || contact.email;
        const address = document.createElement("span");
        address.textContent = contact.name ? contact.email : contact.source;
        const source = document.createElement("small");
        source.textContent = contact.name ? contact.source : "";
        option.append(title, address, source);
        option.addEventListener("pointerdown", (event) => event.preventDefault());
        option.addEventListener("click", () => choose(index));
        list.append(option);
      });
      const open = document.activeElement === email && filtered.length > 0;
      list.hidden = !open;
      email.setAttribute("aria-expanded", String(open));
      const selected = choices.find((contact) => contact.email === query);
      if (selected?.name) name.value = selected.name;
    };
    email.addEventListener("input", update);
    email.addEventListener("change", update);
    email.addEventListener("blur", close);
    email.addEventListener("keydown", (event) => {
      if (event.isComposing) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        if (list.hidden) update();
        if (!filtered.length) return;
        event.preventDefault();
        const index = selectedIndex < 0
          ? (event.key === "ArrowDown" ? 0 : filtered.length - 1)
          : (selectedIndex + (event.key === "ArrowDown" ? 1 : -1) + filtered.length) % filtered.length;
        highlight(index);
      } else if (event.key === "Enter" && !list.hidden && selectedIndex >= 0) {
        event.preventDefault();
        choose(selectedIndex);
      } else if (event.key === "Escape" && !list.hidden) {
        event.preventDefault();
        event.stopPropagation();
        close();
      } else if (event.key === "Tab") close();
    });
    email.addEventListener("focus", async () => {
      update();
      if (globalThis.demo || !inExtension) {
        update();
        return;
      }
      try {
        const response = await chrome.runtime.sendMessage({
          type: "email-connector",
          action: "recruiter-contacts",
        });
        if (!response?.ok || !active()) return;
        choices = merge(
          choices,
          response.data.contacts.map((contact) => ({
            ...contact,
            source: "Recent Gmail correspondent",
          })),
          response.data.account,
        );
        update();
      } catch {
        /* Saved contacts remain usable when Gmail is unavailable. */
      }
    });
    update();
    return list;
  }
  return { merge, attach };
})();
