const { Client, Message, MessageEmbed } = require('discord.js');
const osuApi = require('../../../modules/api/osuApi');
const botConfig = require('../../../config.json');
const osuUser = require('../../../models/osuUser');
const ranks = require('../../../modules/general/ranks');
const level = require('../../../modules/user/level');

module.exports = {
    name: 'autopilot',
    aliases: ['ap'],
    description: 'Get an osu!autopilot profile.',
    usage: 'autopilot [username...]',
    options: [
        "\`Username\`: username of the player.",
    ],
    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    run: async(client, message, args) => {
        if(!args[0]){
            const userID = message.author.id;
            const userSchema = await osuUser.findOne({
                userID
            })

            if (!userSchema) return message.reply(`You have not linked your osu account. Use \`${botConfig.prefix}link <username>\` to link your account.`);

            const { data: playerInfo } = await osuApi().get('get_player_info', {
                params: {
                    name: userSchema.username,
                    scope: 'all'
                }
                }).catch(err => console.error(err));
                
            if(playerInfo == undefined || playerInfo.length == 0) return message.reply(`Could not find user \`${username}\`, check your spelling.`);
            
            const { data: getStatus } = await osuApi().get('get_player_status', {
                params: {
                    id: playerInfo.player.info.id
                }
                }).catch(err => console.error(err));
            
            let status;
            let statuslink;

            if(getStatus.player_status.online == false){
                status = "Offline";
                statuslink = "https://cdn.discordapp.com/emojis/891622774769066034.png";
            } else {
                status = "Online";
                statuslink = "https://cdn.discordapp.com/emojis/891622774651633695.png";
            }

            const embed = new MessageEmbed({
                color: '#0099ff',
                description: `**osu!Autopilot status for: [${playerInfo.player.info.name}](${botConfig.server.domainurl}u/${playerInfo.player.info.id})**`,
                fields: [{
                    name: 'Performance',
                    value: `--- **${playerInfo.player.stats[7].pp}pp**\n**Global Rank** #${playerInfo.player.stats[7].rank} (:flag_${playerInfo.player.info.country}: #${playerInfo.player.stats[7].country_rank})\n**Accuracy:** ${Number((playerInfo.player.stats[7].acc).toFixed(2))}%\n**Playcount:** ${playerInfo.player.stats[7].plays}\n**Level:** ${level(playerInfo.player.stats[7].rscore)}`,
                    inline: true
                }, {
                    name: 'Rank',
                    value: `${ranks("SSH")}: ${playerInfo.player.stats[7].xh_count}\n${ranks("SS")}: ${playerInfo.player.stats[7].x_count}\n${ranks("SH")}: ${playerInfo.player.stats[7].sh_count}\n${ranks("S")}: ${playerInfo.player.stats[7].s_count}\n${ranks("A")}: ${playerInfo.player.stats[7].a_count}`, 
                    inline: true
                }],
                footer: {
                    text: status,
                    icon_url: statuslink
                },
                thumbnail: {
                    url: `${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}`
                }
            })
            
            return message.reply({embeds: [embed]});

        } else {
            const username = args.join(' ').replace(/ /g, "_")
            const { data: playerInfo } = await osuApi().get('get_player_info', {
                params: {
                    name: username,
                    scope: 'all'
                }
                }).catch(err => message.reply(`Could not find user \`${username}\`, check your spelling.`));
                
            if(playerInfo == undefined || playerInfo.length == 0) return;
            
            const { data: getStatus } = await osuApi().get('get_player_status', {
                params: {
                    id: playerInfo.player.info.id
                }
                }).catch(err => message.reply("An error occured while searching for the user. Try again."));

            let status;
            let statuslink;

            if(getStatus.player_status.online == false){
                status = "Offline";
                statuslink = "https://cdn.discordapp.com/emojis/891622774769066034.png";
            } else {
                status = "Online";
                statuslink = "https://cdn.discordapp.com/emojis/891622774651633695.png";
            }

            const embed = new MessageEmbed({
                color: '#0099ff',
                description: `**osu!Autopilot status for: [${playerInfo.player.info.name}](${botConfig.server.domainurl}u/${playerInfo.player.info.id})**`,
                fields: [{
                    name: 'Performance',
                    value: `--- **${playerInfo.player.stats[7].pp}pp**\n**Global Rank** #${playerInfo.player.stats[7].rank} (:flag_${playerInfo.player.info.country}: #${playerInfo.player.stats[7].country_rank})\n**Accuracy:** ${Number((playerInfo.player.stats[7].acc).toFixed(2))}%\n**Playcount:** ${playerInfo.player.stats[7].plays}\n**Level:** ${level(playerInfo.player.stats[7].rscore)}`,
                    inline: true
                }, {
                    name: 'Rank',
                    value: `${ranks("SSH")}: ${playerInfo.player.stats[7].xh_count}\n${ranks("SS")}: ${playerInfo.player.stats[7].x_count}\n${ranks("SH")}: ${playerInfo.player.stats[7].sh_count}\n${ranks("S")}: ${playerInfo.player.stats[7].s_count}\n${ranks("A")}: ${playerInfo.player.stats[7].a_count}`, 
                    inline: true
                }],
                footer: {
                    text: status,
                    icon_url: statuslink
                },
                thumbnail: {
                    url: `${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}`
                }
            })

            return message.reply({embeds: [embed]});
        }
    }
}