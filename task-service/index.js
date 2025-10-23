const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const amqp = require('amqplib');

const port = 3001;
mongoose.connect('mongodb://mongo:27017/tasks', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error('Could not connect to MongoDB...', err));
app.use(bodyParser.json());

const TaskSchema = mongoose.Schema({
    taskId: { type: String, required: true, unique: true },
    taskName: { type: String, required: true },
    createdDate: { type: Date, default: Date.now },
    userId: { type: String, required: true }
});

const Task = mongoose.model('Task', TaskSchema);

let connection, channel;

async function connectRabbitMqWithRetry(retries = 5, delay = 3000) {
    while (retries) {
        try {
            connection = await amqp.connect('amqp://rabbitmq');
            channel = await connection.createChannel();
            await channel.assertQueue("task_created");
            console.log("Connected to RabbitMQ");
            return; // Exit on successful connection
        } catch (err) {
            console.error("Rabbit mq connection err:", err.message);
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

app.get('/tasks', async (req, res) => {
    const tasks = await Task.find();
    res.send(tasks);
});

app.post('/tasks', async (req, res) => {
    const { taskId, taskName, userId } = req.body;
    try {
        const task = new Task({ taskId, taskName, userId });
        await task.save();

        const message = { taskId: task._id, taskName, userId };
        if(!channel){
            return res.status(500).send("Channel not available");
        }

        channel.sendToQueue("task_created", Buffer.from(JSON.stringify(message)));
        res.status(201).send(task);
    } catch (err) {
        console.log("err in saving", err);
        res.status(500).send(err);
    }
});

app.get('/', (req, res) => res.send('Task Service Running!'));

app.listen(port, () => {
    console.log(`Task service listening at http://localhost:${port}`)
    connectRabbitMqWithRetry();
});
