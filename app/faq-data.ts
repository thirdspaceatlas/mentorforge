export type FaqItem = {
  question: string;
  answer: string;
};

export const fullFaqs: FaqItem[] = [
  {
    question:
      "Why would I use MentorForge instead of asking ChatGPT or another AI tool to build me a study plan?",
    answer:
      "ChatGPT can draft a plan in one sitting. That's the easy part. The hard part is the next four months: short weeks, missed weekends, and having to reshuffle what's left. MentorForge stays with the plan after week one. A chatbot gives you a document. This gives you something you can keep using."
  },
  {
    question: "Who is MentorForge for?",
    answer:
      "People sitting a serious exam who also have a job, a family, or a calendar that never looks the same two weeks in a row. If a one-page schedule usually dies by week three, this is built for that life."
  },
  {
    question:
      "Does MentorForge replace prep providers like Kaplan, Mark Meldrum, or CFA Institute materials?",
    answer:
      "No. Keep your books, videos, and question bank. MentorForge sits on top of those and tells you when to use them."
  },
  {
    question:
      "What makes MentorForge different from a spreadsheet or planner template?",
    answer:
      "A spreadsheet holds a plan. It doesn't notice when you miss a week. MentorForge does. It knows the exam window, the short weeks, and what you've actually logged, then rebuilds the remaining weeks."
  },
  {
    question: "Can MentorForge help if I fall behind?",
    answer:
      "Yes. That's half the reason it exists. When a week blows up, you don't start over. Remaining hours get spread over the weeks you still have."
  },
  {
    question:
      "Does MentorForge include study content, lessons, or question banks?",
    answer:
      "Not as the product. Planning, pacing, tracking, and replanning are what we do. Use whatever materials you already trust."
  },
  {
    question: "Do I need to use MentorForge only for CFA exams?",
    answer:
      "It starts with CFA. The longer bet is other serious credentials where the calendar is the hard part, not finding a textbook."
  },
  {
    question: "Can I still use ChatGPT or another AI tool together with MentorForge?",
    answer:
      "Yes. Use ChatGPT to explain a reading. Use MentorForge to decide which reading this week, and what happens if you skip it."
  },
  {
    question:
      "Why does MentorForge focus so much on pacing instead of just content?",
    answer:
      "Most people who fail already bought the materials. They ran out of weeks. Pacing and recovery are the part most prep never helps with."
  },
  {
    question: "What is MentorForge trying to help me do?",
    answer:
      "Stay on a plan. Change the plan when life changes. Still make it to exam day with the work done."
  }
];

/** Homepage: short set. The full list lives on learn-more. */
export const homepageFaqs: FaqItem[] = [
  {
    question: "What's the catch with free?",
    answer:
      "There isn't one. Free includes a full Level I plan, one calendar, a few Calendar Coach nudges each week, and basic progress tracking. All Access lifts the caps and unlocks Levels II and III."
  },
  {
    question: "What if I fail and need to retake?",
    answer:
      "All Access is yearly. If you're sitting again next year, renew. Your plan is still there."
  },
  {
    question: "Is this a tutoring or prep course?",
    answer:
      "No. This is planning and pacing. It tells you when to study what. You bring the books and the Q-bank."
  },
  {
    question: "Is MentorForge affiliated with CFA Institute?",
    answer:
      "No. MentorForge is independent study-planning software. CFA Institute does not endorse, promote, or warrant the accuracy or quality of MentorForge."
  }
];
