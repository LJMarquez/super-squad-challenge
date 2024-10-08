// index.js
// Required modules
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

// Initialize Express application
const app = express();

// Define paths
const clientPath = path.join(__dirname, '..', 'client/src');
const dataPath = path.join(__dirname, 'data', 'superheroes.json');
const serverPublic = path.join(__dirname, 'public');
// Middleware setup
app.use(express.static(clientPath)); // Serve static files from client directory
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json()); // Parse JSON bodies

// Routes

// Home route
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: clientPath });
});

app.get('/heroes', async (req, res) => {
    try {
        const data = await fs.readFile(dataPath, 'utf8');

        const heroes = JSON.parse(data);
        if (!heroes) {
            throw new Error("Error no users available");
        }
        res.status(200).json(heroes);
    } catch (error) {
        console.error("Problem getting heroes" + error.message);
        res.status(500).json({ error: "Problem reading heroes" });
    }
});

// Form route
app.get('/form', (req, res) => {
    res.sendFile('pages/form.html', { root: serverPublic });
});

// Form submission route
app.post('/submit-form', async (req, res) => {
    try {
        const { name, power, universe } = req.body;

        // Read existing users from file
        let heroes = [];
        try {
            const data = await fs.readFile(dataPath, 'utf8');
            heroes = JSON.parse(data);
        } catch (error) {
            // If file doesn't exist or is empty, start with an empty array
            console.error('Error reading hero data:', error);
            heroes = [];
        }

        // Find or create user
        let hero = heroes.find(u => u.name === name && u.power === power && u.universe === universe);
        // if (hero) {
        // user.messages.push(message);
        // } else {
        // user = { name, power, messages: [message] };
        hero = { name, power: [power], universe };
        heroes.push(hero);
        // }

        // Save updated users
        await fs.writeFile(dataPath, JSON.stringify(heroes, null, 2));
        res.redirect('/form');
    } catch (error) {
        console.error('Error processing form:', error);
        res.status(500).send('An error occurred while processing your submission.');
    }
});

// Update user route (currently just logs and sends a response)
app.put('/update-hero/:currentName/:currentUniverse', async (req, res) => {
    try {
        const { currentName, currentPower, currentUniverse } = req.params;
        const { newName, newPower, newUniverse } = req.body;
        console.log('Current hero:', { currentName, currentPower, currentUniverse });
        console.log('New user data:', { newName, newPower, newUniverse });
        const data = await fs.readFile(dataPath, 'utf8');
        if (data) {
            let heroes = JSON.parse(data);
            const heroIndex = heroes.findIndex(hero => hero.name === currentName && hero.universe === currentUniverse);
            console.log(heroIndex);
            if (heroIndex === -1) {
                return res.status(404).json({ message: "Hero not found" })
            }
            heroes[heroIndex] = { ...heroes[heroIndex], name: newName, power: heroes[heroIndex].power, universe: newUniverse };
            heroes[heroIndex].power.push(newPower);
            console.log(heroes);
            await fs.writeFile(dataPath, JSON.stringify(heroes, null, 2));

            // res.redirect('/form');
            res.status(200).json({ message: `You sent ${newName}, ${newPower}, and ${newUniverse}`, reload: true });
        }
    } catch (error) {
        console.error('Error updating hero:', error);
        res.status(500).send('An error occurred while updating the hero.');
    }
});

app.delete('/hero/:name/:universe', async (req, res) => {
    try {
        // console.log(req.params);
        // console.log(req.params.name);
        // console.log(req.params.email);
        // const name = req.params.name;
        // const email = req.params.email;
        const { name, universe } = req.params;
        // console.log req.params
        // then cache returned name and email
        // as destructured variables from params

        // initalize an empty array of 'users'
        let heroes = [];

        try {
            // try to read the users.json file and cache as data
            const data = await fs.readFile(dataPath, 'utf8');
            // parse the data
            heroes = JSON.parse(data);
        } catch (error) {
            return res.status(404).send("File data not found");
        }

        // cache the userIndex based on a matching name and email
        let heroIndex = heroes.findIndex(hero => hero.name === name && hero.universe === universe);
        if (heroIndex === -1) {
            return res.sendStatus(404).send("Hero not found");
        }
        heroes.splice(heroIndex, 1);
        // console.log(heroIndex);
        // console.log(heroes);
        try {
            await fs.writeFile(dataPath, JSON.stringify(heroes, null, 2));
            res.status(200).json({ message: "Success", reload: true });
            // res.redirect('/form');
        } catch (error) {
            console.error("Failed to write to database");
        }
        return res.send("Succussfully eliminated hero");

        // splice the users array with the intended delete name and email

        // send a success deleted message
    } catch (error) {
        console.error(error.message);
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});