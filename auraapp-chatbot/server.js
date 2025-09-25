require('dotenv').config();  // MUST be first
console.log('AWS Region loaded:', process.env.AWS_REGION);

const express = require('express');//express → main framework to create the web server.
const bodyParser = require('body-parser');//bodyParser → middleware that parses(changes) incoming request bodies (HTTP requests have headers and a body, like JSON) to JS so code can be used easily
const cors = require('cors');//cors(Cross-Origin Resource Sharing) → middleware that allows requests from other origins (useful if frontend is on another domain eg localhost and flask).
const path = require('path');

const playerRoutes = require('./routes/playerRoutes');//playerRoutes → your routes module that handles /player/... requests. so data can be processed(stored, validate, transform) by devs and sent back to be displayed.
const addPlayerRoute = require('./routes/addPlayer');

const app = express();
const PORT = 3000;
// creates an Express application instance. eg localhost

app.use(cors()); //middleware. CORS allows domains to make requests to my API
app.use(bodyParser.json()); //parese (changes) http JSON bodies to js to be red easily

app.use(express.static(path.join(__dirname, 'client')));

app.use('/', playerRoutes); //use playerRoutes for any /player requests starting with /
app.use('/add-player', addPlayerRoute); // User submissions

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); //starts sever on port 3000 and logs the URL calls

//request and response = req and res

