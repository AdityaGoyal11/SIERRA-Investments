const db = require('./Local_register');

async function test() {

    await new Promise(resolve => setTimeout(resolve, 2000));

    db.createTables();
    console.log("tables Created");


    try {
        const regResult = await db.registerUser('iodjwd@test.com', 'password', 'Test');
        console.log("Register success", regResult);
    } 
    catch (err) {
        console.log("Failed", err.message);
    }
}