import { Publisher, PublisherConfig } from "../Publisher";
import { Consumer, ITopicConfig, Kafka, Producer } from "kafkajs";
import * as messagingConsts from "./consts";
import { Subscriber, SubscriberConfig } from "../Subscriber";

export class KafkaPublisher implements Publisher {
  topic: string;
  private producer: Producer;

  private constructor(topic: string, producer: Producer) {
    this.topic = topic;
    this.producer = producer;
  }

  static async create(config: PublisherConfig) {
    const kafka = new Kafka({
      clientId: config.client,
      brokers: messagingConsts.BROKERS,
    });

    const producer = kafka.producer();
    await producer.connect();
    await registerKafka([config.topic], kafka);

    return new KafkaPublisher(config.topic, producer);
  }

  async publish(data: Object): Promise<void> {
    await this.producer.send({
      topic: this.topic,
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

  static async create(config: SubscriberConfig): Promise<KafkaSubscriber> {
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

async function registerKafka(topics: string[], kafka: Kafka) {
  const admin = kafka.admin();
  await admin.connect();
  const iTopics: ITopicConfig[] = topics.map((topic) => {
    return {
      topic,
      numPartitions: 3,
      replicationFactor: 3,
    };
  });
  await admin.createTopics({ topics: iTopics });
  await admin.disconnect();
}
