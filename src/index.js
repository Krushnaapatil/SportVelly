import express from 'express';

const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('hello from Express server');
});

app.listen(port, () => {
    console.log(`Express server running on http://localhost:${port}`);
})