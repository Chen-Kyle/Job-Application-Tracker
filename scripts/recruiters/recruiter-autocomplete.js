// Native email autocomplete backed by saved contacts and an account-scoped Gmail cache.
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
    const list = document.createElement("datalist");
    list.id = "recruiter-email-suggestions";
    email.setAttribute("list", list.id);
    email.autocomplete = "off";
    let choices = merge(
      (globalThis.demo ? samples : jobs).flatMap(
        (item) => item.recruiterContacts || [],
      ),
      [],
    );
    const update = () => {
      const query = email.value.toLowerCase();
      list.replaceChildren();
      for (const contact of choices
        .filter(
          (item) =>
            item.email.includes(query) ||
            item.name.toLowerCase().includes(query),
        )
        .slice(0, 20)) {
        const option = document.createElement("option");
        option.value = contact.email;
        option.label = `${contact.name || contact.email} · ${contact.source}`;
        list.append(option);
      }
      const selected = choices.find((contact) => contact.email === query);
      if (selected?.name) name.value = selected.name;
    };
    email.addEventListener("input", update);
    email.addEventListener("change", update);
    email.addEventListener("focus", async () => {
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
