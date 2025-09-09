import { Kafka, KafkaJSNonRetriableError } from "kafkajs";
import { initKafka, shutdownKafka, KafkaCallback } from "../../kafka/kafka";
import { describe, it, jest, expect, beforeEach } from "@jest/globals";

jest.mock("kafkajs");

const mockProducer = {
  connect: jest.fn().mockImplementation(() => Promise.resolve()),
  disconnect: jest.fn().mockImplementation(() => Promise.resolve()),
} as any;

const mockConsumer = {
  connect: jest.fn().mockImplementation(() => Promise.resolve()),
  disconnect: jest.fn().mockImplementation(() => Promise.resolve()),
  subscribe: jest.fn().mockImplementation(() => Promise.resolve()),
  run: jest.fn().mockImplementation(() => Promise.resolve()),
} as any;

const mockKafka = {
  producer: jest.fn().mockReturnValue(mockProducer),
  consumer: jest.fn().mockReturnValue(mockConsumer),
} as any;

(Kafka as jest.MockedClass<typeof Kafka>).mockImplementation(() => mockKafka);

describe("Kafka", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mock implementations
    mockProducer.connect.mockImplementation(() => Promise.resolve());
    mockProducer.disconnect.mockImplementation(() => Promise.resolve());
    mockConsumer.connect.mockImplementation(() => Promise.resolve());
    mockConsumer.disconnect.mockImplementation(() => Promise.resolve());
    mockConsumer.subscribe.mockImplementation(() => Promise.resolve());
    mockConsumer.run.mockImplementation(() => Promise.resolve());
  });

  it("should initialize Kafka successfully", async () => {
    const config = {
      clientId: "test",
      brokers: ["localhost:9092"],
    };
    const topics = ["test"];
    const mockCallback = jest
      .fn()
      .mockImplementation(() => Promise.resolve()) as KafkaCallback;

    const producer = await initKafka(config, topics, mockCallback);

    expect(producer).toBeDefined();
    expect(mockKafka.producer).toHaveBeenCalled();
    expect(mockKafka.consumer).toHaveBeenCalledWith({
      groupId: "test",
    });
    expect(mockProducer.connect).toHaveBeenCalled();
    expect(mockConsumer.connect).toHaveBeenCalled();
    expect(mockConsumer.subscribe).toHaveBeenCalledWith({
      topics,
      fromBeginning: true,
    });
    expect(mockConsumer.run).toHaveBeenCalled();
  });

  it("should use default consumer group ID when clientId is not provided", async () => {
    const config = {
      brokers: ["localhost:9092"],
    };
    const topics = ["test"];
    const mockCallback = jest
      .fn()
      .mockImplementation(() => Promise.resolve()) as KafkaCallback;

    await initKafka(config, topics, mockCallback);

    expect(mockKafka.consumer).toHaveBeenCalledWith({
      groupId: "default-consumer-group",
    });
  });

  it("should process messages through callback", async () => {
    const config = {
      clientId: "test",
      brokers: ["localhost:9092"],
    };
    const topics = ["test"];
    const mockCallback = jest
      .fn()
      .mockImplementation(() => Promise.resolve()) as KafkaCallback;

    let eachMessageHandler: any;
    mockConsumer.run.mockImplementation((params: any) => {
      eachMessageHandler = params.eachMessage;
      return Promise.resolve();
    });

    await initKafka(config, topics, mockCallback);

    // Simulate receiving a message
    const mockPayload = {
      topic: "test-topic",
      partition: 0,
      message: {
        value: Buffer.from("test message"),
        key: null,
        timestamp: "1234567890",
        attributes: 0,
        offset: "0",
        headers: {},
      },
    };

    await eachMessageHandler(mockPayload);

    expect(mockCallback).toHaveBeenCalledWith(
      "test-topic",
      0,
      mockPayload.message
    );
  });

  it("should handle KafkaJSNonRetriableError with KafkaJSNumberOfRetriesExceeded", async () => {
    const consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    const kafkaError = new KafkaJSNonRetriableError("Connection failed");
    Object.defineProperty(kafkaError, "name", {
      value: "KafkaJSNumberOfRetriesExceeded",
      writable: true,
    });

    // Mock producer to fail with the specific error, then succeed
    mockProducer.connect
      .mockRejectedValueOnce(kafkaError)
      .mockImplementationOnce(() => Promise.resolve());

    // Mock consumer to succeed
    mockConsumer.connect.mockImplementation(() => Promise.resolve());

    const config = {
      clientId: "test",
      brokers: ["localhost:9092"],
    };
    const topics = ["test"];
    const mockCallback = jest
      .fn()
      .mockImplementation(() => Promise.resolve()) as KafkaCallback;

    await initKafka(config, topics, mockCallback);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Could not connect Connection failed"
    );
    consoleWarnSpy.mockRestore();
  });

  it("should handle unknown errors in retryKafkaConnection", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const unknownError = new Error("Unknown error");

    // Mock producer to fail with unknown error, then succeed
    mockProducer.connect
      .mockRejectedValueOnce(unknownError)
      .mockImplementationOnce(() => Promise.resolve());

    // Mock consumer to succeed
    mockConsumer.connect.mockImplementation(() => Promise.resolve());

    const config = {
      clientId: "test",
      brokers: ["localhost:9092"],
    };
    const topics = ["test"];
    const mockCallback = jest
      .fn()
      .mockImplementation(() => Promise.resolve()) as KafkaCallback;

    await initKafka(config, topics, mockCallback);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Unknown connection error Unknown error"
    );
    consoleErrorSpy.mockRestore();
  });

  it("should handle non-Error objects in retryKafkaConnection", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const nonErrorObject = "String error";

    // Mock producer to fail with non-Error object, then succeed
    mockProducer.connect
      .mockRejectedValueOnce(nonErrorObject)
      .mockImplementationOnce(() => Promise.resolve());

    // Mock consumer to succeed
    mockConsumer.connect.mockImplementation(() => Promise.resolve());

    const config = {
      clientId: "test",
      brokers: ["localhost:9092"],
    };
    const topics = ["test"];
    const mockCallback = jest
      .fn()
      .mockImplementation(() => Promise.resolve()) as KafkaCallback;

    await initKafka(config, topics, mockCallback);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Unknown connection error String error"
    );
    consoleErrorSpy.mockRestore();
  });

  it("should handle KafkaJSNonRetriableError with different name", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const kafkaError = new KafkaJSNonRetriableError("Different error");
    Object.defineProperty(kafkaError, "name", {
      value: "DifferentErrorName",
      writable: true,
    });

    // Mock producer to fail with different error name, then succeed
    mockProducer.connect
      .mockRejectedValueOnce(kafkaError)
      .mockImplementationOnce(() => Promise.resolve());

    // Mock consumer to succeed
    mockConsumer.connect.mockImplementation(() => Promise.resolve());

    const config = {
      clientId: "test",
      brokers: ["localhost:9092"],
    };
    const topics = ["test"];
    const mockCallback = jest
      .fn()
      .mockImplementation(() => Promise.resolve()) as KafkaCallback;

    await initKafka(config, topics, mockCallback);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Unknown connection error Different error"
    );
    consoleErrorSpy.mockRestore();
  });

  it("should shutdown Kafka connections", async () => {
    await shutdownKafka();

    expect(mockProducer.disconnect).toHaveBeenCalled();
    expect(mockConsumer.disconnect).toHaveBeenCalled();
  });
});
