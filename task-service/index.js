const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const port = 3001;
mongoose.connect('mongodb://mongo:27017/tasks', {useNewUrlParser: true, useUnifiedTopology: true})
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

app.get('/tasks', async (req, res) => {
    const tasks = await Task.find();
    res.send(tasks);
});

app.post('/tasks', async (req, res) => {
    const { taskId, taskName, userId } = req.body;
    try {
        const task = new Task({ taskId, taskName, userId });
        await task.save();
        res.status(201).send(task);
    } catch (err) {
        console.log("err in saving", err);
        res.status(500).send(err);
    }
});

app.get('/', (req, res) => res.send('Task Service Running!'));

app.listen(port, () => console.log(`Task service listening at http://localhost:${port}`));