require('dotenv').config();
const app = require('./src/index.js');
const port = process.env.PORT || 88;

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
