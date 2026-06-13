import amqplib, { type Channel, type Connection } from "amqplib";
import { loadConfig } from "./config.js";

let connection: Connection | null = null;
let channel: Channel | null = null;

export const EXCHANGE_NAME = "medcare.events";

export async function getChannel(): Promise<Channel> {
  if (channel) return channel;

  const config = loadConfig();
  connection = await amqplib.connect(config.RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });

  return channel;
}

export async function consumeEvents(
  queue: string,
  routingKeys: string[],
  handler: (msg: unknown, routingKey: string) => Promise<void>
): Promise<void> {
  const ch = await getChannel();
  await ch.assertQueue(queue, { durable: true });

  for (const key of routingKeys) {
    await ch.bindQueue(queue, EXCHANGE_NAME, key);
  }

  await ch.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      const data = JSON.parse(msg.content.toString());
      await handler(data, msg.fields.routingKey);
      ch.ack(msg);
    } catch (err) {
      console.error("Error processing message:", err);
      ch.nack(msg, false, false);
    }
  });
}
