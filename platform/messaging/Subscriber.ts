export interface Subscriber {
  create(config: SubscriberConfig): Promise<Subscriber>;
}

export interface SubscriberConfig {
  clientId: string;
  groupId: string;
  topics: string[];
  callback: Function;
}
