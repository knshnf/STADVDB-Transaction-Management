const db = require('./db.js');

const nodes = {
    getNodesToQueryRead: async function() {
        if (await db.ping_node('CENTRAL')) {
            return ['CENTRAL']
        } else if (await db.ping_node('LUZON') && await db.ping_node('VISMIN')) {
            return ['LUZON', 'VISMIN']
        } else if (await db.ping_node('LUZON')) {
            return ['LUZON']
        } else if (await db.ping_node('VISMIN')) {
            return ['VISMIN']
        } else {
            return []
        }
    },

    // Returns a tuple, the first item is the nodes to query, second where it needs to be replicated, third where to execute log
    getNodesToQueryWrite: async function(target) {
        if (await db.ping_node('CENTRAL')) {
            if (target === 'LUZON') {
                // Central and Luzon are Online
                if (await db.ping_node('LUZON')) {
                    return [
                        ['CENTRAL'], // Write to central
                        ['LUZON'], // Replicate to Luzon
                        ['LUZON']
                    ]
                } else { // Need to write a log because LUZON is offline
                    return [
                        ['CENTRAL'],
                        [],
                        ['LUZON'] // Write log for luzon
                    ]
                }
            }

            if (target === 'VISMIN') {
                if (await db.ping_node('VISMIN')) {
                    return [
                        ['CENTRAL'], // Write to central
                        ['VISMIN'], // Replicate to VISMIN
                        ['VISMIN']
                    ]
                } else { // Need to write a log because VISMIN is offline
                    return [
                        ['CENTRAL'],
                        [],
                        ['VISMIN'] // Write log for luzon
                    ]
                }
            }
            // Central is unavailable
        } else if (target === 'LUZON' && await db.ping_node('LUZON')) {
            return [
                ['LUZON'], // Write to luzon
                [], // No replication since central is offline
                ['CENTRAL'] // Create log for central instead

            ]
        } else if (target === 'VISMIN' && await db.ping_node('VISMIN')) {
            return [
                ['VISMIN'], // Write to vismin
                [], // No replication since central is offline
                ['CENTRAL'] // Create log for central instead
            ]
        } else {
            // No nodes are available
            [
                [],
                [],
                [],
            ]
        }
    },
}

module.exports = nodes;