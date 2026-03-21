export type TopicDefinition = {
  id: string;
  name: string;
  recommendedHours: number;
};

export const CFA_L1_TOPICS: TopicDefinition[] = [
  {
    id: "ethics",
    name: "Ethical and Professional Standards",
    recommendedHours: 30
  },
  {
    id: "quant",
    name: "Quantitative Methods",
    recommendedHours: 20
  },
  {
    id: "econ",
    name: "Economics",
    recommendedHours: 20
  },
  {
    id: "fra",
    name: "Financial Reporting and Analysis",
    recommendedHours: 40
  },
  {
    id: "corpfin",
    name: "Corporate Finance",
    recommendedHours: 20
  },
  {
    id: "equity",
    name: "Equity Investments",
    recommendedHours: 30
  },
  {
    id: "fixed",
    name: "Fixed Income",
    recommendedHours: 20
  },
  {
    id: "deriv",
    name: "Derivatives",
    recommendedHours: 10
  },
  {
    id: "alts",
    name: "Alternative Investments",
    recommendedHours: 10
  },
  {
    id: "pm",
    name: "Portfolio Management and Wealth Planning",
    recommendedHours: 10
  }
];

