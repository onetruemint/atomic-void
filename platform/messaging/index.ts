import NodeCache from 'node-cache';
import { KafkaPublisher } from './kafka';
import { Publisher } from './Publisher'

export async function createPublisher(serviceName: string, cache: NodeCache, topicSubscriptions: string[]): Promise<Publisher> {
  return Promise.resolve(new KafkaPublisher(serviceName, cache, topicSubscriptions));
}

export * from './Publisher';