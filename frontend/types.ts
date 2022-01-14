export interface Account {
  addr: string;
  name?: string;
}

export interface Response {
  results: Account[];
}
