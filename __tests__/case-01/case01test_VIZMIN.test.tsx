

const request = require('supertest');
const app = require('../../index.js'); // Assuming your Express app instance is exported from app.js

const PORTZ = 5001; // central node 
let rc = require('../../models/recoverer.js');
rc.update_node("VIZMIN");

describe('Start app and render index', () => {
    let browser;
    let page;
    let server;

    beforeAll((done) => {
      server = app.listen(PORTZ, () => {
        console.log(`Test server listening on port ${PORTZ}`);
        done();
      });

    });
  
    afterAll((done) => {
      server.close(done);
    });

    const testCase = async () => {
        it('can go to view appointments', async () => {
            const response = await request(app).get('/view');
            expect(response.status).toBe(200);
            const dataArray = [
                '065B80E34BFB48870AF7ACD6CE9A31AE',
                '49',
                'FEMALE',
                'ACE Dumaguete Doctors',
                'Tue Jan 02 2024',
                'Dumaguete City',
                'Negros Oriental',
                'Central Visayas (VII)',
                'family medicine'
            ];
            
            dataArray.forEach(item => {
                expect(response.text).toContain(item);
            });
            // Add more assertions as needed
        }, 20000);
    };

    describe ('Concurrent transactions in two or more nodes are reading the same data item', () => {
        for (let i = 1; i < 4; i++) {
            customLog(`[INFO] ITERATION ${i} out of 3...`);
            testCase();
          }
    });
});




