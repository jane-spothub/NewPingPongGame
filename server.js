const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// set ejs as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json()); // <-- important for req.body
app.use(express.static(path.join(__dirname, "public")));


app.get('/', (req, res) => {
// allow ?category=1&level=2 in URL
    const category = parseInt(req.query.category) || 1;
    const level = parseInt(req.query.level) || 1;
    res.render('index', { category, level });
});


app.listen(port, () =>
    console.log(`PingPong server running on http://localhost:${port}`));


// Chess - With piece movement, check/checkmate detection
// help make this game and let it have easy,medium,hard,advanced,expert,Novice levels of chess
// make it have an option to change themes of the board and chess peices