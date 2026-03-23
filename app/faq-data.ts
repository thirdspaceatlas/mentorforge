export type FaqItem = {
  question: string;
  answer: string;
};

export const fullFaqs: FaqItem[] = [
  {
    question:
      "Why would I use MentorForge instead of asking ChatGPT or another AI tool to build me a study plan?",
    answer:
      "ChatGPT and other AI tools can generate a study plan, but MentorForge is built to manage the study process over time. The value is not just “here’s a plan.” It is that the plan is structured around exam windows, realistic weekly pacing, partial weeks, benchmark readiness, actual progress, and rebalancing when someone falls behind. In other words, a general-purpose AI tool can draft a plan once; MentorForge is designed to help someone stay on plan, adapt the plan, and finish."
  },
  {
    question: "Who is MentorForge for?",
    answer:
      "MentorForge is built for people preparing for serious exams and certifications who need more than a one-time study plan. It is especially useful for working professionals balancing study time with jobs, family, and inconsistent schedules."
  },
  {
    question:
      "Does MentorForge replace prep providers like Kaplan, Mark Meldrum, or CFA Institute materials?",
    answer:
      "No. MentorForge is not a replacement for course content, question banks, or official curriculum materials. It is designed to sit on top of those resources and help users organize, pace, and adapt their study process over time."
  },
  {
    question:
      "What makes MentorForge different from a spreadsheet or planner template?",
    answer:
      "A spreadsheet can hold a plan, but MentorForge is designed to actively manage it. It accounts for benchmark pacing, partial weeks, exam windows, actual progress, and replanning when someone falls behind, which makes it much more useful than a static template."
  },
  {
    question: "Can MentorForge help if I fall behind?",
    answer:
      "Yes. One of the core ideas behind MentorForge is that real life interrupts study plans. Instead of forcing users to start over, MentorForge is designed to rebalance remaining weeks so they can recover realistically and keep moving forward."
  },
  {
    question:
      "Does MentorForge include study content, lessons, or question banks?",
    answer:
      "Not as the core product. MentorForge focuses first on planning, pacing, progress tracking, and replanning. It is designed to work alongside the materials users already rely on."
  },
  {
    question: "Do I need to use MentorForge only for CFA exams?",
    answer:
      "No. MentorForge may begin with CFA-focused planning, but the broader vision is to support serious exams and certifications where pacing, structure, and consistency matter."
  },
  {
    question: "Can I still use ChatGPT or another AI tool together with MentorForge?",
    answer:
      "Yes. ChatGPT and other AI tools can be useful for explanations, summaries, and content support. MentorForge is designed to complement that by managing the long-term structure of the study process."
  },
  {
    question:
      "Why does MentorForge focus so much on pacing instead of just content?",
    answer:
      "Because many candidates do not fail for lack of materials. They fall behind on execution. MentorForge is built around the idea that pacing, consistency, and recovery are often the missing pieces in exam prep."
  },
  {
    question: "What is MentorForge trying to help me do?",
    answer:
      "MentorForge is designed to help users stay on plan, adapt when life changes, and finish strong."
  }
];

export const homepageFaqs: FaqItem[] = fullFaqs.slice(0, 6);
