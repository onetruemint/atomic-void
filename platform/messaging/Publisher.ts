export interface Publisher {
  publish(name: string, data: Object): Promise<void>;
}
