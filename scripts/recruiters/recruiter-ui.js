// Job-specific recruiter contacts and explicitly attached conversation summaries.
globalThis.RecruiterUI = (() => {
  const results = new Map();
  const pending = new Set();
  let revision = 0;
  function render(job, editing, change) {
    const version = ++revision;
    const container = document.getElementById("job-recruiters");
    container.replaceChildren();
    const contacts = job.recruiterContacts || [];
    const notice = document.createElement("p");
    notice.className = "email-secondary";
    notice.textContent = globalThis.demo ? "Fictional sample contacts. Click Edit, then Find conversations to attach example threads." : contacts.length
      ? "Conversations are separate from status-update email activity."
      : "No recruiter contacts yet. Click Edit to add one.";
    container.append(notice);
    const feedback = document.createElement("p");
    feedback.setAttribute("role", "status");
    const save = async (value) => {
      try {
        await change(RecruiterData.normalize(value));
      } catch (error) {
        feedback.textContent = error.message;
      }
    };
    for (const contact of contacts) {
      const card = document.createElement("article");
      card.className = "email-card";
      const heading = document.createElement("h4");
      heading.textContent = contact.name || contact.email;
      const address = document.createElement("p");
      address.className = "email-secondary";
      address.textContent = contact.email;
      const compose = document.createElement("a");
      const composeParams = new URLSearchParams({
        view: "cm",
        fs: "1",
        to: contact.email,
        su: `${job.role} at ${job.company}`,
      });
      if (contact.conversations?.[0]?.account)
        composeParams.set("authuser", contact.conversations[0].account);
      compose.href = `https://mail.google.com/mail/?${composeParams}`;
      compose.target = "_blank";
      compose.rel = "noopener noreferrer";
      compose.textContent = "Email recruiter in Gmail ↗";
      card.append(heading, address, compose);
      const key = `${job.id}:${contact.email}`;
      const run = async (refresh) => {
        pending.add(key);
        controls.querySelectorAll("button").forEach((button) => {
          button.disabled = true;
        });
        try {
          if (globalThis.demo) {
            pending.delete(key);
            if (refresh) { controls.querySelectorAll("button").forEach(button => { button.disabled = false; }); return; }
            results.set(key, RecruiterSamples.conversations(job, contact.email));
            render(job, editing, change);
            return;
          }
          if (!inExtension)
            throw Error(
              "Connect Gmail in the installed extension to search conversations.",
            );
          const attached = contact.conversations || [];
          const accounts = new Set(attached.map((thread) => thread.account));
          if (refresh && accounts.size !== 1)
            throw Error(
              "Refresh conversations from one Gmail account at a time.",
            );
          const response = await chrome.runtime.sendMessage({
            type: "email-connector",
            action: "recruiter-threads",
            email: contact.email,
            ...(refresh
              ? {
                  threadIds: attached.map((thread) => thread.threadId),
                  account: attached[0]?.account,
                }
              : {}),
          });
          if (!response?.ok)
            throw Error(response?.error || "Conversation lookup failed.");
          if (
            version !== revision ||
            !document.getElementById("job-details").open
          ) {
            pending.delete(key);
            return;
          }
          pending.delete(key);
          if (refresh) {
            await save(
              contacts.map((item) =>
                item.email === contact.email
                  ? {
                      ...item,
                      conversations: attached.map(
                        (old) =>
                          response.data.conversations.find(
                            (thread) => thread.threadId === old.threadId,
                          ) || old,
                      ),
                    }
                  : item,
              ),
            );
          } else results.set(key, response.data.conversations);
          pending.delete(key);
          if (
            document.getElementById("job-details").open &&
            document.getElementById("job-recruiters").dataset.jobId === job.id
          ) {
            if (!refresh) render(job, editing, change);
          }
        } catch (error) {
          pending.delete(key);
          feedback.textContent = error.message;
          controls.querySelectorAll("button").forEach((button) => {
            button.disabled = false;
          });
        }
      };
      const controls = document.createElement("div");
      controls.className = "email-actions";
      if (editing) {
        const search = document.createElement("button");
        search.type = "button";
        search.textContent = pending.has(key)
          ? "Searching…"
          : "Find conversations";
        search.disabled = pending.has(key);
        search.addEventListener("click", () => run(false));
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Remove contact";
        remove.addEventListener("click", () =>
          save(contacts.filter((item) => item.email !== contact.email)),
        );
        controls.append(search, remove);
      }
      if (!editing && contact.conversations?.length) {
        const refresh = document.createElement("button");
        refresh.type = "button";
        refresh.textContent = pending.has(key)
          ? "Refreshing…"
          : "Refresh conversations";
        refresh.disabled = pending.has(key);
        refresh.addEventListener("click", () => run(true));
        controls.append(refresh);
      }
      card.append(controls);
      for (const thread of [...(contact.conversations || [])].sort((a,b)=>Date.parse(b.latestAt)-Date.parse(a.latestAt))) {
        const row = document.createElement("div");
        row.className = "recruiter-thread";
        const link = document.createElement("a");
        link.href = EmailLinks.message(thread.account, thread.threadId);
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = thread.subject.slice(0, 160) + " ↗";
        link.title = thread.subject;
        const dates = document.createElement("p");
        dates.className = "email-secondary";
        dates.textContent = `Latest ${thread.direction === "sent" ? "sent by you" : "received"}: ${new Date(thread.latestAt).toLocaleString()} · You last emailed: ${thread.lastSentAt ? new Date(thread.lastSentAt).toLocaleString() : "No sent message found"}`;
        const checked = document.createElement("p");
        checked.className = "email-secondary";
        checked.textContent = `Last refreshed: ${new Date(thread.checkedAt).toLocaleString()}`;
        row.append(link, dates, checked);
        if (thread.messages?.length) {
          const chain = document.createElement("details"); chain.className="recruiter-chain";
          const summary = document.createElement("summary"); summary.textContent=`${thread.messages.length} emails · newest first`;
          chain.append(summary);
          for (const message of [...thread.messages].sort((a,b)=>Date.parse(b.receivedAt)-Date.parse(a.receivedAt))) {
            const entry=document.createElement("article"); entry.className="recruiter-message";
            const sender=document.createElement("strong");sender.textContent=message.direction==='sent'?'You sent':message.from || contact.name || contact.email;
            const date=document.createElement("p");date.className="email-secondary";date.textContent=new Date(message.receivedAt).toLocaleString();
            const body=document.createElement("p");body.textContent=message.snippet;
            entry.append(sender,date,body);chain.append(entry);
          }
          row.append(chain);
        }
        if (editing) {
          const detach = document.createElement("button");
          detach.type = "button";
          detach.textContent = "Detach conversation";
          detach.addEventListener("click", () =>
            save(
              contacts.map((item) =>
                item.email === contact.email
                  ? {
                      ...item,
                      conversations: item.conversations.filter(
                        (old) =>
                          old.threadId !== thread.threadId ||
                          old.account !== thread.account,
                      ),
                    }
                  : item,
              ),
            ),
          );
          row.append(detach);
        }
        card.append(row);
      }
      if (editing && results.has(key)) {
        const caption = document.createElement("p");
        caption.className = "email-secondary";
        caption.textContent = results.get(key).length
          ? "Choose conversations for this job (up to 20 search results)."
          : "No conversations found for this address.";
        card.append(caption);
        for (const thread of results.get(key)) {
          const row = document.createElement("div");
          row.className = "recruiter-thread";
          const title = document.createElement("span");
          title.textContent = `${thread.subject.slice(0, 160)} · ${new Date(thread.latestAt).toLocaleDateString()}`;
          const attach = document.createElement("button");
          attach.type = "button";
          attach.textContent = "Attach";
          attach.disabled = (contact.conversations || []).some(
            (old) =>
              old.threadId === thread.threadId &&
              old.account === thread.account,
          );
          attach.addEventListener("click", () =>
            save(
              contacts.map((item) =>
                item.email === contact.email
                  ? {
                      ...item,
                      conversations: [...(item.conversations || []), thread],
                    }
                  : item,
              ),
            ),
          );
          row.append(title, attach);
          card.append(row);
        }
      }
      container.append(card);
    }
    if (editing) {
      const form = document.createElement("form");
      form.className = "recruiter-contact-form";
      const nameLabel = document.createElement("label");
      nameLabel.textContent = "Recruiter name (optional)";
      const name = document.createElement("input");
      name.maxLength = 200;
      nameLabel.append(name);
      const emailLabel = document.createElement("label");
      emailLabel.textContent = "Recruiter email";
      const email = document.createElement("input");
      email.type = "email";
      email.required = true;
      email.maxLength = 254;
      emailLabel.append(email);
      const add = document.createElement("button");
      add.type = "submit";
      add.textContent = "Add recruiter";
      form.append(nameLabel, emailLabel, add);
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        save([
          ...contacts,
          {
            name: name.value.trim(),
            email: email.value.trim(),
            conversations: [],
          },
        ]);
      });
      container.append(form);
    }
    container.append(feedback);
    container.dataset.jobId = job.id;
  }
  return { render };
})();
