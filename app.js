const Discord = require('discord.js');
const Commands = require('./commands.js');
const config = require('./config.json');
const client = new Discord.Client();

const instagram = require('./instagram.js');

client.on("ready", async() => {
  console.log('#'.repeat(25));
  console.log(`Logged in as ${client.user.tag}`);
  console.log('#'.repeat(25));
  try {
    console.log('Logging in to instagram');
    ig = await instagram.load();
    console.log('Connected!');
  } catch (error) {
    console.log('Failed to connect, quitting now');
    console.log(error);
    process.exit(1);
  }
});

client.on("message", async msg => {
  if(!msg.content.startsWith(config.bot.prefix)) {
    if(msg.author.bot) {
      return;
    } else {
      await Commands.mediaPost(msg, ig);
      return;
    }
  } else {
    console.log(`Command from ${msg.author.tag}: ${msg.content}`);
    let flags = msg.content.replace(config.bot.prefix, "").split(' ');
    switch(flags[0]) {
      case "help":
        await Commands.help(msg);
        break;
      case "ping":
        await msg.channel.send('Pong!');
        break;
      default:
        break;
    }
  }
});

client.login(config.discord.token);
