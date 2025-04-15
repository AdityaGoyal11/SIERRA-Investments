const db = require('./Local_register');

async function test() {

    await new Promise(resolve => setTimeout(resolve, 2000));

    db.createTables();
    console.log("tables Created");


    try {
        const regResult = await db.registerUser('user@test.com', 'password111', 'Test');
        console.log("Register success", regResult);

        const logResult = await db.loginUser('user@test.com', 'password111');
        console.log("Login Success:", logResult);
    } 
    catch (err) {
        console.log("Failed", err.message);
    }
}