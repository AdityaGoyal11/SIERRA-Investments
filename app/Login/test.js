const db = require('./Local_register');

async function test() {

    await new Promise(resolve => setTimeout(resolve, 2000));

    db.createTables();
    console.log("tables Created");
}