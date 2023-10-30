import path from 'path';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

app.use(express.static('dist'));

app.get('*', (req, res) => {
  return res.sendFile(path.resolve('dist/index.html'));
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log('Started static react natours app on', PORT);
});
