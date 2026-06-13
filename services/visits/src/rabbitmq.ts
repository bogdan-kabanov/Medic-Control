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

export async function publishEvent(routingKey: string, data: unknown): Promise<void> {
  const ch = await getChannel();
  ch.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(data)), {
    persistent: true,
    contentType: "application/json",
  });
}
