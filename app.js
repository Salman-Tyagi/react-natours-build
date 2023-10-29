import express from 'express';
import path from 'path';

const app = express();

app.use(express.static('dist'));

app.get('*', (req, res) => {
  return res.sendFile(path.resolve('dist/index.html'));
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log('Started static react natours app on', PORT);
});
