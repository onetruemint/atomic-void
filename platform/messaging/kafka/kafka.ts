import {
  Consumer,
  Producer,
  Kafka,
  KafkaMessage,
  KafkaConfig,
  EachMessagePayload,
  KafkaJSNonRetriableError,
} from "kafkajs";

let consumer: Consumer;
let producer: Producer;

export type KafkaCallback = (
  topic: string,
  partition: number,
  message: KafkaMessage
) => Promise<void>;

export async function initKafka(
  config: KafkaConfig,
  topics: Array<string>,
  callback: KafkaCallback
): Promise<Producer> {
  const kafka = new Kafka(config);
  producer = kafka.producer();
  consumer = kafka.consumer({
    groupId: config.clientId ?? "default-consumer-group",
  });

  await retryKafkaConnection(producer);
  await retryKafkaConnection(consumer);

  await consumer.subscribe({ topics, fromBeginning: true });

  await consumer.run({
    eachMessage: async (payload: EachMessagePayload) => {
      const { topic, partition, message } = payload;
      await callback(topic, partition, message);
    },
  });

  return producer;
}

async function retryKafkaConnection(kafkaObj: Producer | Consumer) {
  let connectorConnected,
    connectorKafkaFatalError = false;

  while (!connectorConnected && !connectorKafkaFatalError) {
    try {
      await kafkaObj.connect();
      connectorConnected = true;
    } catch (e) {
      if (
        e instanceof KafkaJSNonRetriableError &&
        e.name === "KafkaJSNumberOfRetriesExceeded"
      ) {
        console.warn(`Could not connect ${e.message}`);
      } else {
        console.error(
          `Unknown connection error ${
            e instanceof Error ? e.message : String(e)
          }`
        );
        connectorKafkaFatalError = true;
      }
    }
  }
}

export async function shutdownKafka() {
  await producer.disconnect();
  await consumer.disconnect();
}
