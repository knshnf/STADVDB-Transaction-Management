const db = require('./db.js');

const recoverer = {
    update_node: async function(node) {
        console.log('[INFO] recoverer.js: Attempting to recover transactions for Node ' + node);
        var nodesToQuery = ['CENTRAL', 'LUZON', 'VISMIN'];
        nodesToQuery = nodesToQuery.filter(n => n !== node);

        var sql_statements = []

        try {
            const promises = nodesToQuery.map(async function(n) {
                const sql = "SELECT * FROM transaction_log WHERE node = " + "'" + node + "' AND status = 0";
                const results = await db.query_node(n, sql);

                if (results.length > 0) {
                    console.log(`[INFO] recoverer.js: SQL statements for node ${n}:`);
                    results.forEach(row => {
                        sql_statements.push(row.sql_statement);
                        db.query_node(node, row.sql_statement);
                        var updateSql = "UPDATE transaction_log SET status = 1 WHERE id = " + row.id;
                        db.query_node(n, updateSql);
                    });
                    console.log('[INFO] recoverer.js: executed sql statements found in ' + n + 'log');
                } else {
                    console.log(`[INFO] recoverer.js: No SQL statements found for node ${n}`);
                }
            });

            await Promise.all(promises);
        } catch (error) {
            console.error(`recoverer.js: Error updating node ${node}:`, error);
        }
    }
};



module.exports = recoverer;
module.exports = recoverer;