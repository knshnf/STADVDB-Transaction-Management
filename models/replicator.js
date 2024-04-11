const db = require('./db.js');

const replicator = {
    replicate: async function(source, target, sql, transactionId) {
        // For test cases 3 & 4
        // console.log("Attempting to replicate...");
        // await new Promise(r => setTimeout(r, 30000)); 

        // Insert to target
        await db.query_node(target, sql);
        await db.query_node(source, "UPDATE transaction_log SET status = 1 WHERE id = '" + transactionId + "'");
    }
};



module.exports = replicator;