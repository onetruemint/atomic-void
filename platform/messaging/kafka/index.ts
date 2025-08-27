import { KafkaConfig, KafkaMessage, Producer } from "kafkajs";
import NodeCache from "node-cache";
import { Publisher } from "../publisher";
import { initKafka } from "./kafka";
import { fetchEnvVar } from "@platform/utils";

export class KafkaPublisher implements Publisher {
  private producer: Producer | undefined;

  constructor(serviceName: string, cache: NodeCache, topics: string[]) {
    let brokers;
    try {
      brokers = fetchEnvVar("ATOMIC_KAFKA_BROKERS").split(",");
    } catch {
      brokers = [fetchEnvVar("ATOMIC_KAFKA_HOST")];
    }

    const kafkaConfig: KafkaConfig = {
      clientId: serviceName,
      brokers,
    };

    registerKafka(kafkaConfig, cache, topics).then((producer: Producer) => {
      this.producer = producer;
    });
  }

  async publish(name: string, data: Object): Promise<void> {
    await this.producer?.send({
      topic: name,
      messages: [
        {
          value: JSON.stringify(data),
        },
      ],
    });
  }
}

export async function registerKafka(
  kafkaConfig: KafkaConfig,
  cache: NodeCache,
  topics: string[]
): Promise<Producer> {
  const producer = await initKafka(kafkaConfig, topics, kafkaCallback);

  async function kafkaCallback(
    topic: string,
    partition: number,
    message: KafkaMessage
  ) {
    const value = message.value ?? "";
    try {
      cache.set(topic, JSON.parse(value.toString()));
      cache.emit(topic);
    } catch {
      console.error("Invalid Kafka message");
    }
  }

  return producer;
}
