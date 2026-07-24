export type SubscriberEntry = {
  id: string;
  email: string;
  source?: string;
  consent: boolean;
  confirmed: boolean;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type SubscriberListResult = {
  docs: SubscriberEntry[];
  page: number;
  limit: number;
  totalDocs: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  /** Summary counts across the whole set (not just this page). */
  stats: {
    total: number;
    confirmed: number;
    pending: number;
  };
};

export type SubscriberStatus = "all" | "confirmed" | "pending";

export type ListSubscribersParams = {
  q?: string;
  status?: SubscriberStatus;
  page?: number;
  limit?: number;
};
