const express = require('express');
const path = require('path');

const app = express();

app.use(express.static('react_build'));

app.get('*', (req, res) => {
  return res.sendFile(path.resolve(__dirname, './react_build/index.html'));
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log('Server started on port ' + PORT);
});
