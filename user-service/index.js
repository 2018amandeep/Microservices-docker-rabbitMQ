const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const port = 3000;
mongoose.connect('mongodb://mongo:27017/users', {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => console.log('Connected to MongoDB...'))
.catch(err => console.error('Could not connect to MongoDB...', err));
app.use(bodyParser.json());

const UserSchema = mongoose.Schema({
    name: String,
    email: String
});

const User = mongoose.model('User', UserSchema);

app.get('/users', async (req, res) => {
    const users = await User.find();
    res.send(users);
});

app.post('/users', (req,res) => {
    const { name, email } = req.body;
    try{
        const user = new User({name, email});
        user.save();
        res.status(201).send(user);
    }catch(err){
        console.log("err in saving", err)
        res.status(500).send(err);
    }
})

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));