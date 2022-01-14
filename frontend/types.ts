export interface Account {
  addr: string;
  name?: string;
}

export interface Response {
  results: Account[];
}

export type Feedback = Record<string, FeedbackDetails>;

export interface FeedbackDetails {
  name?: string;
  isGoodRecommendation: boolean;
}
