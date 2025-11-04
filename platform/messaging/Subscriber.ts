export interface Subscriber {}

export interface SubscriberConfig {
  clientId: string;
  groupId: string;
  topics: string[];
  callback: Function;
}
