const { Client, Message, MessageEmbed } = require('discord.js');
const osuApi = require('../../../modules/api/osuApi');
const botConfig = require('../../../config.json');

module.exports = {
    name: 'manialeaderboard',
    aliases: ['manialb'],
    description: 'Get the best 10 osu!mania users in the server.',
    usage: 'manialeaderboard',
    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    run: async(client, message, args) => {
        const { data: leaderboard } = await osuApi().get('get_leaderboard', {
            params: {
                limit: 10,
                mode: 3
            }
            }).catch(err => message.reply("An error occured while searching users in the leaderboard."));
        
        let names = "";
        let pps = "";
        let positions = "";
        
        for(let i = 0; i < leaderboard.leaderboard.length; i++){
            names += ":flag_"+leaderboard.leaderboard[i].country+": "+leaderboard.leaderboard[i].name+"\n";
            pps += leaderboard.leaderboard[i].pp+"pp\n";
            positions += "#"+(i+1)+"\n";
        }

        const embed = new MessageEmbed({
            color: '#0099ff',
            title: `Top ${leaderboard.leaderboard.length} osu!mania players in the server`,
            url: `${botConfig.server.domainurl}leaderboard/mania/pp/vn`,
            fields: [{
                name: '\u200b',
                value: `\*\*${positions}\*\*`,
                inline: true
            }, {
                name: "Nick",
                value: `${names}`,
                inline: true
            }, {
                name: "PP",
                value: `${pps}`,
                inline: true
            }],
            thumbnail: {
                url: `${botConfig.server.logourl}`
            }
        })
        
        message.reply({embeds: [embed]});
    }
}