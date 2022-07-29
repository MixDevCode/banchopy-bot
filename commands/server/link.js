const { Client, Message, MessageEmbed } = require('discord.js');
const osuUser = require('../../models/osuUser');
const osuApi = require('../../modules/api/osuApi');
const userExists = require('../../modules/user/userExists');
const botConfig = require('../../config.json');

module.exports = {
    name: 'link',
    description: 'Link your osu! account.',
    usage: 'link <username>',
    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    run: async(client, message, args) => {
        if(!args[0]){
            return message.reply('Please provide a username.')
        } else {
            let user = args.join('_')
            if(await userExists(user) == true) {
                const { data: playerInfo } = await osuApi().get('get_player_info', {
                    params: {
                        name: user,
                        scope: 'all'
                    }
                    }).catch(err => console.error(err));

                await osuUser.findOneAndUpdate({ userID: message.author.id }, { username: user }, {
                    upsert: true,
                    new: true
                })
                .then(() => {
                    const embed = new MessageEmbed({
                        color: '#0099ff',
                        title: `Successfully linked your osu! account to ${user}.`,
                        url: `${botConfig.server.domainurl}u/${playerInfo.player.info.id}`,
                        image: {
                            url: `${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}`
                        },
                        description: `You can now use the \`${botConfig.prefix}osu\` command to see your osu! stats.`,
                        footer: {
                            text: `${client.user.username}`,
                            icon_url: `${client.user.displayAvatarURL()}`
                        },
                        timestamp: new Date()
                    })

                    message.reply({embeds: [embed]});
                })
                .catch(() => {
                    message.channel.send('An error occured.')
                });
            } else {
                return message.channel.send('User does not exist. Register first.')
            }
        }
    }
}