import { Publisher } from "../Publisher";
import { Consumer, Kafka, Producer } from "kafkajs";
import * as messagingConsts from "./consts";
import { Subscriber, SubscriberConfig } from "../Subscriber";

export class KafkaPublisher implements Publisher {
  private producer: Producer;

  private constructor(client: string) {
    const kafka = new Kafka({
      clientId: client,
      brokers: messagingConsts.BROKERS,
    });
    this.producer = kafka.producer();
    this.producer.connect();
  }

  async publish(name: string, data: Object): Promise<void> {
    await this.producer.send({
      topic: name,
      messages: [{ value: JSON.stringify(data) }],
    });
  }

  async shutdown(): Promise<void> {
    await this.producer.disconnect();
  }
}

export class KafkaSubscriber implements Subscriber {
  consumer: Consumer;

  private constructor(consumer: Consumer) {
    this.consumer = consumer;
  }

  async create(config: SubscriberConfig): Promise<Subscriber> {
    const kafka = new Kafka({
      clientId: config.clientId,
      brokers: messagingConsts.BROKERS,
    });

    const consumer = kafka.consumer({
      groupId: config.groupId,
    });

    await consumer.connect();
    await consumer.subscribe({
      topics: config.topics,
      fromBeginning: true,
    });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        config.callback(topic, partition, message);
      },
    });

    return new KafkaSubscriber(consumer);
  }

  async shutdown(): Promise<void> {
    await this.consumer.disconnect();
  }
}
