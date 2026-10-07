# Email suggestion test cases

## Setup

1. Reload the extension at chrome://extensions and reopen the dashboard.
2. Use your real dashboard, rather than the sample view. Set email approval to manual for these tests.
3. Add a test application: company **Harbor Test Labs**, role **Software Engineering Intern**, status **Saved**, with a unique job link.
4. Send these messages to your connected Gmail **from another email account**. Emails sent from the connected account to itself can have the Sent label, which our search excludes.
5. Click Check now. Each check reads a small batch; repeat if the dashboard says more messages remain. Scanning is not instant or guaranteed to reach every email on the first check.
6. Use a new message for each test. Approved and dismissed messages do not appear again unless you undo their approval.

## Assessment with a relative deadline

Subject: HARBOR TEST LABS — Software Engineering Intern assessment

Body: Please complete the technical assessment for the Software Engineering Intern position at Harbor Test Labs. You have 7 days to complete this test starting from today.

Expected: A reviewable Complete assessment task, a proposed deadline seven calendar days after the received date, and an email timeline entry after approval. The status stays Saved. Check that the date is correct, edit it, approve, and try Undo last email approval.

## Employer match without a role

Subject: Harbor Test Labs application assessment

Body: To continue your application at Harbor Test Labs, we'd like to invite you to take a short online technical assessment.

Expected: Choose an application before approving. No role means no automatic attachment. Add another job at the same company and confirm both jobs remain selectable.

## Interview scheduling and reply

Subject: Harbor Test Labs — Software Engineering Intern interview

Body: Please schedule an interview for the Software Engineering Intern position at Harbor Test Labs. Please reply with your availability.

Expected: Schedule interview and Reply to recruiter tasks. Explicit scheduling wording may also suggest Interviewing. These tasks still require review in automatic mode.

## Email activity without a status or task

Subject: Harbor Test Labs — Software Engineering Intern application update

Body: We are still reviewing your Software Engineering Intern application at Harbor Test Labs. We will contact you when we have an update.

Expected: A reviewable email activity suggestion without a status change or task. Approval adds it to the job's email timeline.

## Explicit date and business-day limitation

Subject: Harbor Test Labs — assessment deadline

Body: Please complete the assessment for Harbor Test Labs by 2026-10-20.

Expected: Proposed deadline 2026-10-20, editable before approval.

Then send: Please complete the assessment for Harbor Test Labs within 7 business days.

Expected: An assessment task without a guessed deadline. Enter the deadline yourself.

## Negated or conditional instructions

Subject: Harbor Test Labs — application update

Body: You do not need to complete an assessment. If we invite you to complete an assessment, we will email you later.

Expected: No assessment task. The application-related company email may still be offered as email activity; it should not imply a completed or scheduled assessment.

## Newsletter

Subject: Harbor Test Labs newsletter

Body: Harbor Test Labs has new products and a seasonal sale. Read our latest news.

Expected: No suggestion. A newsletter mentioning hiring or interviews can still produce a false positive for manual review; dismiss it.

## Different employer, ambiguous wording, and forwarded mail

- Replace Harbor Test Labs with another company. An explicit action may appear as an unmatched suggestion, but must not automatically attach to Harbor Test Labs.
- Use a shortened role, like SWE Intern. Exact role matching may fail and require choosing an application.
- Say "Please complete the coding screen" without "assessment", "test", "challenge", or "exercise". A task may be missed; add it manually.
- Forward a real email. Quoted reply text may be stripped, so direct messages are a better baseline test.
- Include two tasks with different deadlines or "next Friday at 5 PM EST". Deadline parsing is limited and may miss or misassociate dates; review them carefully.
- Put important instructions far down a long message. Full-body fallback improves coverage but cannot guarantee every template is understood.

## Persistence and duplicate checks

After approving a test, click Check now repeatedly: no duplicate activity or tasks should appear. Refresh the dashboard and confirm tasks and links remain. Undo the approval: tasks and activity should disappear, and the email should return for review. Download and restore a backup into a separate test installation to check preservation of email activity and tasks.

Emails older than 30 days are outside the search window. Sleep can delay periodic checks, and disconnected Gmail or manual-only frequency stops automatic checks.
