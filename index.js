// index.js
const { app } = require('electron');
require('./main1'); // Require main1.js

app.on('ready', () => {
    require('./main'); // Optionally require main.js as well
});
