const Discord = require('discord.js');
const Jimp = require('jimp');
const config = require('./config.json');
const dedent = require('dedent-js');
const fs = require('fs');
const promisify = require('util').promisify;
const get = require('request-promise').get;
const path = require('path');
const url_ = require('url');
const readFileAsync = promisify(fs.readFile);

module.exports = {
  help: async function(msg) {
    let mbd = new Discord.MessageEmbed()
      .setColor(config.bot.embedcolor)
      .setFooter(config.bot.footer.text, config.bot.footer.url)
      .addFields({
        name: 'Commands',
        value: await commands(msg)
      });
    msg.channel.send(mbd);
  },
  mediaPost: async function(msg, ig) {
    // check if instagram channel
    let whitelist = await config.whitelist.instagram;
    console.log(whitelist);
    console.log("Checking: " + msg.channel.id);
    if(whitelist.includes(msg.channel.id)) {
      console.log('Its in the whitelist');
      // check if theres an attachment
      let image;
      let iurl;
      if(msg.attachments.size > 0) {
        iurl = msg.attachments.array()[0].url;
        console.log('Its an attachment: ' + iurl);
      } else if(msg.content.match(/\bhttps?:\/\/\S+/gi) != null) {
        iurl = msg.content.match(/\bhttps?:\/\/\S+/gi)[0];
        console.log('Its in the text: ' + iurl);
      } else {
        console.log('Theres no url here');
        console.log(msg.content.match(/\bhttps?:\/\/\S+/gi));
        return;
      }
      // check if image
      if(iurl.match(/\.(jpeg|jpg|png|bmp|tiff)$/) != null) {
        console.log('Its an image');
        let content = msg.content.replace(/(?:https?):\/\/[\n\S]+/g, '') + " " + config.instagram.append;
        let imageBuffer = await get({
          url: iurl,
          encoding: null,
        });
        // verify jpg and write as temp file
        let temp = url_.parse(iurl).path;
        temp = path.parse(temp).name+'.jpg';
        console.log('Converting to jpg: ' + temp);
        while(!fs.existsSync(temp)) {
          await Jimp.read(imageBuffer)
            .then(idata => {
              idata.write(temp);
            }
          ) .catch(err => {
              console.log(err);
            }
          );
        }
        // upload image
        console.log('Uploading: ' + temp + ' | ' + content);
        let publishResult;
        try {
          publishResult = await ig.publish.photo({
            file: await readFileAsync(temp),
            caption: await content
          });
        } catch(error) {
          console.log('Failed to upload image');
          await msg.channel.send('Sorry, something went wrong. This might help:\n\n```'+error+'```');
          // delete the image
          await fs.unlinkSync(temp);
          console.log('Deleted ' + temp);
          return;
        }
        // build url and send bot message
        let url = 'https://www.instagram.com/p/' + publishResult.media.code;
        console.log("Uploaded " + iurl + " | IG: " + url);
        await msg.channel.send(url);
        // delete the image
        await fs.unlinkSync(temp);
        console.log('Deleted ' + temp);
        return;
      }
      return;
    }
    console.log("Not in the whitelist");
    return;
  }
}

async function commands(msg) {
  let igwlt = "";
  let igwl = config.whitelist.instagram;
  igwl.forEach(c => {
    igwlt = igwlt+'<#'+c+'>\n';
  });
  return(dedent(`
    ${config.bot.prefix}help - receive this message
    ${config.bot.prefix}ping - pong!

    **Social Media**
    In the respective whitlisted channels, send an image attachment with whatever text and tags you want on the post.

    *Instagram*
    ${igwlt}
  `));
}
