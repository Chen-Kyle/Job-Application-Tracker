// Fictional conversations for the sample dashboard; never query a real mailbox.
globalThis.RecruiterSamples = (() => {
  function contact(job) {
    return { name: 'Alex Morgan', email: `alex@${job.company.toLowerCase().replace(/\s+/g, '-')}.example.com`, conversations: [] };
  }
  function conversations(job, email) {
    const recruiter = contact(job);
    const make = (suffix, subject, texts) => {
      const messages = texts.map(([direction, snippet], index) => ({
        subject, from: direction === 'sent' ? 'You <sample-user@example.com>' : `${recruiter.name} <${email}>`,
        receivedAt: new Date(Date.now() - (texts.length - index) * 86400000).toISOString(), direction, snippet,
      })).reverse();
      return { threadId: `${job.id}-${suffix}`, account: 'sample-user@example.com', subject,
        snippet: messages[0].snippet, latestAt: messages[0].receivedAt,
        lastSentAt: messages.find(message => message.direction === 'sent')?.receivedAt || null,
        direction: messages[0].direction, checkedAt: new Date().toISOString(), messages };
    };
    return [
      make('interview', `${job.role}: interview scheduling`, [
        ['received', `Hi! We'd like to arrange an interview for the ${job.role} position at ${job.company}. Are you available this week?`],
        ['sent', 'Thanks for reaching out! I am available Tuesday afternoon or Thursday morning.'],
        ['received', 'Thursday at 10 AM works. I will send the calendar invitation shortly.'],
      ]),
      make('follow-up', `Following up on ${job.role}`, [
        ['sent', `Hi Alex, I wanted to follow up on my ${job.role} application. Please let me know if you need anything else.`],
        ['received', 'Thanks for following up. The team is reviewing applications and I expect an update next week.'],
        ['sent', 'Thank you for the update! I look forward to hearing from you.'],
      ]),
    ].sort((a,b)=>Date.parse(b.latestAt)-Date.parse(a.latestAt));
  }
  return {contact, conversations};
})();
