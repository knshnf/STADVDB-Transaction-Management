const request = require('supertest');
const app = require('../../index.js'); // Assuming your Express app instance is exported from app.js
//const userEvent = require("@testing-library/user-event");

let rc = require('../../models/recoverer.js');
rc.update_node("VISMIN");

const PORTZ = 4001; // central node 


describe('GET /', () => {

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
    it('can see view file', async () => {
      //const response = await request(app).get('/delete');
      //await expect(response.status).toBe(200);

      // create a new entry
/*
      let formData = {
        appointmentId: "-1",
        patientAge: 49,
        patientGender: "FEMALE",
        hospitalName: "PCC Hospital",
        queueDate: '2024-01-01',
        city: "Tacloban",
        province: "Leyte",
        regionName: 'Eastern Visayas (VIII)',
        mainSpecialty: 'amongus'
        // Add more form fields as needed
      };

      const makeRes = await request(app)
      .post('/create')
      .send(formData);

      await expect(makeRes.status).toBe(200);*/

      
      const response = await request(app).get('/view');
      await expect(response.status).toBe(200);

      await expect(response.text).toContain("-1");

      const response2 = await request(app).get('/');
      await expect(response2.status).toBe(200);

      const response3 = await request(app).get('/view');
      await expect(response3.status).toBe(200);

       
      await expect(response3.text).toContain("-1");

      

      
      
      //expect(response.text).toContain('Index Page'); // Replace 'Index Page' with your actual index page content
      // Add more assertions as needed
    }, 20000);
  };
  
  describe ('At least one transaction in the three nodes is writing (update / delete) and the  other concurrent transactions are reading the same data item', () => {
    for (let i = 1; i < 4; i++) {
        customLog(`[INFO] ITERATION ${i} out of 3...`);
        testCase();
      }
  });
  
});


