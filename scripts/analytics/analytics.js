// Local dashboard statistics. Each application is counted once using its applied date.
globalThis.Analytics = (() => {
  const statuses = ['Applied','Interviewing','Offer','Rejected','Withdrawn'];
  function summarize(jobs, period = 'weekly', now = new Date()) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (period === 'monthly') start.setDate(1);
    else if (period === 'weekly') start.setDate(start.getDate() - (start.getDay() + 6) % 7);
    const buckets = [];
    for (let offset = 11; offset >= 0; offset--) {
      const date = new Date(start);
      if (period === 'monthly') date.setMonth(date.getMonth() - offset);
      else date.setDate(date.getDate() - offset * (period === 'daily' ? 1 : 7));
      const end = new Date(date);
      if (period === 'monthly') end.setMonth(end.getMonth() + 1);
      else end.setDate(end.getDate() + (period === 'daily' ? 1 : 7));
      buckets.push({start:date.getTime(),end:end.getTime(),label:date.toLocaleDateString(undefined,{month:'short',...(period==='monthly'?{year:'numeric'}:{day:'numeric'})}),count:0});
    }
    let missingDates = 0;
    const outcomes = Object.fromEntries(statuses.map(status => [status,0]));
    const steps = {pending:0,dueSoon:0,overdue:0};
    for (const job of jobs) {
      if (job.status in outcomes) outcomes[job.status]++;
      const history = (job.statusHistory || []).filter(event => !event.activityDeletedAt && event.from !== event.to && event.to === 'Applied' && Number.isFinite(Date.parse(event.at))).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
      const applied = Date.parse(job.appliedAt || history[0]?.at);
      if (Number.isFinite(applied)) {
        const bucket = buckets.find(item => applied >= item.start && applied < item.end);
        if (bucket && applied <= now.getTime()) bucket.count++;
      } else if (job.status && job.status !== 'Saved') missingDates++;
      for (const task of job.nextSteps || []) {
        if (task.completed) continue;
        steps.pending++;
        const reminder = StepReminders.describe(task,now);
        if (reminder.kind === 'overdue') steps.overdue++;
        if (reminder.kind === 'soon') steps.dueSoon++;
      }
    }
    return {buckets,outcomes,steps,missingDates};
  }
  function render() {
    const container = document.querySelector('#analytics-chart');
    if (!container) return;
    const period = document.querySelector('#analytics-period').value;
    const data = summarize(jobs,period);
    const max = Math.max(1,...data.buckets.map(bucket=>bucket.count));
    container.replaceChildren();
    for (const bucket of data.buckets) {
      const row = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = bucket.label;
      const track = document.createElement('span');
      track.className = 'analytics-track';
      track.setAttribute('aria-hidden','true');
      const bar = document.createElement('span');
      bar.className = 'analytics-bar';
      bar.style.width = `${bucket.count/max*100}%`;
      track.append(bar);
      const count = document.createElement('strong');
      count.textContent = `${bucket.count}`;
      row.append(label,track,count);
      container.append(row);
    }
    const outcomes = document.querySelector('#analytics-outcomes');
    outcomes.replaceChildren();
    for (const [status,count] of Object.entries(data.outcomes)) {
      const term = document.createElement('dt'); term.textContent = status;
      const value = document.createElement('dd'); value.textContent = count;
      outcomes.append(term,value);
    }
    document.querySelector('#analytics-pending').textContent = data.steps.pending;
    document.querySelector('#analytics-due-soon').textContent = data.steps.dueSoon;
    document.querySelector('#analytics-overdue').textContent = data.steps.overdue;
    document.querySelector('#analytics-date-note').textContent = data.missingDates ? `${data.missingDates} application(s) have no recorded applied date and are excluded from the chart.` : 'Uses applied dates, not saved dates. Each application is counted once.';
  }
  return {summarize,render};
})();
document.querySelector('#analytics-period').addEventListener('change',()=>Analytics.render());
Analytics.render();
