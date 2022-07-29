const { Client, Message, MessageEmbed } = require('discord.js');
const osuApi = require('../../modules/api/osuApi');
const botConfig = require('../../config.json');
module.exports = {
    name: 'serverinfo',
    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    run: async(client, message, args) => {
        let msg = await message.channel.send("Searching for server info...");
        const { data: playerCount } = await osuApi().get('get_player_count').catch(err => msg.edit("An error occured while searching for server info."));

        console.log(playerCount)
        const { data: lastPlayer } = await osuApi().get('get_player_info', {
            params: {
                id: playerCount.counts.total+1,
                scope: 'all'
            }
            }).catch(err => message.reply("An error occured while searching for server info."));

        const embed = new MessageEmbed({
            color: '#0099ff',
            title: `General information of ${botConfig.server.servername}`,
            url: `${botConfig.server.domainurl}`,
            description: `**Total players:** ${playerCount.counts.total}\n**Online players:** ${playerCount.counts.online}\n**Last registered:** ${lastPlayer.player.info.name} from :flag_${lastPlayer.player.info.country}:\n\n**Website:** [${(botConfig.server.domainurl.replace('https://','')).replace('/','')}](${botConfig.server.domainurl})\n**API (for dev purposes):** [${botConfig.server.apiurl}](${botConfig.server.apiurl})\n\nIf you want to know how API works, please check this page: https://github.com/JKBGL/gulag-api-docs\n\nIf you want to know how to connect to the server, check this tutorial: https://imgur.com/a/iA6OxcS`,
            thumbnail: {
                url: `${botConfig.server.logourl}`
            }
        })
            
        msg.delete();
        message.channel.send({embeds: [embed]});
    }
}