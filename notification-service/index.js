const amqp = require('amqplib');

let connection, channel;

async function connectRabbitMqWithRetry(retries = 10, delay = 3000) {
    while (retries) {
        try {
            connection = await amqp.connect('amqp://rabbitmq');
            channel = await connection.createChannel();
            await channel.assertQueue("task_created");
            console.log("Connected to RabbitMQ");
            return;
        } catch (err) {
            console.error("RabbitMQ connection error:", err.message);
            retries--;
            if (retries === 0) {
                console.error("Failed to connect to RabbitMQ after all retries");
                return;
            }
            console.log(`Retrying connection in ${delay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function start() {
    await connectRabbitMqWithRetry();
    
    if (channel) {
        channel.consume("task_created", (msg) => {
            const task = JSON.parse(msg.content.toString());
            console.log("Notification!!! NEW TASK", task);
            channel.ack(msg);
        });
    }
}

start();


// Youtube video for this reference: https://www.youtube.com/watch?v=w11dXbZJCBE