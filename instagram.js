const config = require('./config.json');
const { IgApiClient } = require('instagram-private-api');
const fs = require('fs');

module.exports = {
  load: async function() {
    const ig = new IgApiClient();
    ig.state.generateDevice(config.instagram.username);
    ig.request.end$.subscribe(async () => {
      let serialized = await ig.state.serialize();
      delete serialized.constants;
      fakeSave(serialized);
    });
    if (fakeExists()) {
      await ig.state.deserialize(fakeLoad());
    }
    await ig.account.login(config.instagram.username, config.instagram.password);
    return ig;
  }
}

async function fakeSave(data) {
  console.log('Saving cookie');
  fs.writeFile('./ig.json', JSON.stringify(data), (err) => {
    if (err) {
      console.log(err);
    }
  });
  return data;
}

async function fakeExists() {
  console.log('Checking for cookie');
  if(fs.existsSync('./ig.json')) {
    return true;
  } else {
    return false;
  }
}

async function fakeLoad() {
  console.log('Loading cookie');
  let data;
  await fs.readFile('./ig.json', (err, data) => {
    if (err) throw err;
    return data;
  });
  return data;
}
