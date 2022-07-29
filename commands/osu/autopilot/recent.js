const { Client, Message, MessageEmbed } = require('discord.js');
const checkParameter = require('../../../modules/general/checkParameter');
const modReplace = require('../../../modules/osu/modReplace');
const osuApi = require('../../../modules/api/osuApi');
const botConfig = require('../../../config.json');
const osuUser = require('../../../models/osuUser');
const ranks = require('../../../modules/general/ranks');
const banchoApi = require('../../../modules/api/banchoApi');
const stars = require('../../../modules/osu/stars');
const timeAgo = require('../../../modules/osu/timeAgo');
const modsEnum = require('../../../modules/osu/modsEnum');
const mapStatus = require('../../../modules/osu/mapStatus');
const completed = require('../../../modules/osu/completed');
const scoreFormat = require('../../../modules/osu/scoreFormat');

module.exports = {
    name: 'autopilotrecent',
    aliases: ['aprs', 'apr'],
    description: 'Get the most recent autopilot play of a user',
    usage: 'autopilotrecent [username...]',
    options: [
        "\`Username\`: username of the player.",
        "Recent best \`(-b)\`: Gets 5 best recent scores in top 100. (no param)",
    ],
    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    run: async(client, message, args) => {
        if (!args[0]) {
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
                }).catch(err => message.reply(`Could not find user \`${username}\`, check your spelling.`));
                
                if(playerInfo == undefined || playerInfo.length == 0) return;

            const { data: recentInfo } = await osuApi().get('get_player_scores', {
                params: {
                    id: playerInfo.player.info.id,
                    scope: 'recent',
                    limit: 1,
                    mode: 8,
                }
                }).catch(err => message.reply("Could not find recent plays. Maybe you don't have recent any play.."));
            
            if (!recentInfo.scores.length || recentInfo.scores.length == 0) return message.reply("Could not find recent plays. Maybe you don't have any recent play..");
            
            const { data: modsFixed } = await banchoApi().get('get_beatmaps', {
                params: {
                    k: botConfig.apikey,
                    b: recentInfo.scores[0].beatmap.id,
                    mods: modReplace(recentInfo.scores[0].mods)
                }
                }).catch(err => console.log(err));

            const embed = new MessageEmbed({
                color: '#0099ff',
                author: {
                    name: `Most recent osu!AutoPilot play for ${playerInfo.player.info.name}`,
                    icon_url: `${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}`
                },
                description: `∷ ${stars(modsFixed[0].difficultyrating, recentInfo.scores[0].beatmap.mode)} **[${recentInfo.scores[0].beatmap.title}](https://osu.ppy.sh/beatmapsets/${recentInfo.scores[0].beatmap.set_id}#osu/${recentInfo.scores[0].beatmap.id})** (${Number((parseFloat(modsFixed[0].difficultyrating)).toFixed(2))}★) \`${modsEnum({mod: recentInfo.scores[0].mods}).mod_text}\` • ${scoreFormat(recentInfo.scores[0].score)}\n${ranks(recentInfo.scores[0].grade)} *${recentInfo.scores[0].beatmap.version}* • **${Number((recentInfo.scores[0].pp).toFixed(2))}pp** • x${recentInfo.scores[0].max_combo}/${recentInfo.scores[0].beatmap.max_combo}\n${Number((recentInfo.scores[0].acc).toFixed(2))}% \`[ ${recentInfo.scores[0].n300} • ${recentInfo.scores[0].n100} • ${recentInfo.scores[0].n50} • ${recentInfo.scores[0].nmiss} ]\``,
                thumbnail: {
                    url: `https://assets.ppy.sh/beatmaps/${recentInfo.scores[0].beatmap.set_id}/covers/list@2x.jpg`
                }
            })
            
            if(recentInfo.scores[0].grade == "F") {
                embed.setFooter({ text: `${mapStatus(recentInfo.scores[0].beatmap.status).toString()} • Completed: ${completed(recentInfo.scores[0].time_elapsed, recentInfo.scores[0].beatmap.total_length)}% • ${timeAgo(recentInfo.scores[0].play_time)}`});
            } else {
                embed.setFooter({ text: `${mapStatus(recentInfo.scores[0].beatmap.status).toString()} • ${timeAgo(recentInfo.scores[0].play_time)}`});
            }

            return message.reply({embeds: [embed]});

        } else {
            const parameters = checkParameter(args, "-b");
            if (parameters.contains == true && parameters.hasUser == true) {
                let username = checkParameter(args, "-b").args;
                const { data: playerInfo } = await osuApi().get('get_player_info', {
                    params: {
                        name: username,
                        scope: 'all'
                    }
                    }).catch(err => message.reply(`Could not find user \`${username}\`, check your spelling.`));
                
                if(playerInfo == undefined || playerInfo.length == 0) return;

                const { data: recentInfo } = await osuApi().get('get_player_scores', {
                    params: {
                        id: playerInfo.player.info.id,
                        scope: 'recent',
                        limit: 100,
                        mode: 8,
                        include_failed: false
                    }
                    }).catch(err => message.reply("Could not find recent plays. Maybe the user doesn't have any recent play."));
                
                if (!recentInfo.scores.length || recentInfo.scores.length == 0) return message.reply("Could not find recent plays. Maybe the user doesn't have any recent play.");
                for(let i = 0; i < recentInfo.scores.length; i++) {
                    recentInfo.scores[i].id = i;
                }
                recentInfo.scores.sort(function(a, b){return b.pp-a.pp});

                let description = "";
                if(recentInfo.scores.length >= 5){
                    for (let i = 0; i < 5; i++) {
                        const { data: modsFixed } = await banchoApi().get('get_beatmaps', {
                            params: {
                                k: botConfig.apikey,
                                b: recentInfo.scores[i].beatmap.id,
                                mods: modReplace(recentInfo.scores[i].mods)
                            }
                        });

                        description = description+`${recentInfo.scores[i].id}. ${stars(modsFixed[0].difficultyrating, recentInfo.scores[i].beatmap.mode)} **[${recentInfo.scores[i].beatmap.title}](https://osu.ppy.sh/b/${recentInfo.scores[i].beatmap.id})** (${Number((parseFloat(modsFixed[0].difficultyrating)).toFixed(2))}★) \`${modsEnum({mod: recentInfo.scores[i].mods}).mod_text}\` • ${scoreFormat(recentInfo.scores[i].score)}\n${ranks(recentInfo.scores[i].grade)} *${recentInfo.scores[i].beatmap.version}* • **${Number((recentInfo.scores[i].pp).toFixed(2))}pp** • x${recentInfo.scores[i].max_combo}/${recentInfo.scores[i].beatmap.max_combo}\n${Number((recentInfo.scores[i].acc).toFixed(2))}% \`[ ${recentInfo.scores[i].n300} • ${recentInfo.scores[i].n100} • ${recentInfo.scores[i].n50} • ${recentInfo.scores[i].nmiss} ]\`\n${timeAgo(recentInfo.scores[i].play_time)}\n\n`;
                    }
                } else {
                    for (let i = 0; i < recentInfo.scores.length; i++) {
                        const { data: modsFixed } = await banchoApi().get('get_beatmaps', {
                            params: {
                                k: botConfig.apikey,
                                b: recentInfo.scores[i].beatmap.id,
                                mods: modReplace(recentInfo.scores[i].mods)
                            }
                        });

                        description = description+`${recentInfo.scores[i].id}. ${stars(modsFixed[0].difficultyrating, recentInfo.scores[i].beatmap.mode)} **[${recentInfo.scores[i].beatmap.title}](https://osu.ppy.sh/b/${recentInfo.scores[i].beatmap.id})** (${Number((parseFloat(modsFixed[0].difficultyrating)).toFixed(2))}★) \`${modsEnum({mod: recentInfo.scores[i].mods}).mod_text}\` • ${scoreFormat(recentInfo.scores[i].score)}\n${ranks(recentInfo.scores[i].grade)} *${recentInfo.scores[i].beatmap.version}* • **${Number((recentInfo.scores[i].pp).toFixed(2))}pp** • x${recentInfo.scores[i].max_combo}/${recentInfo.scores[i].beatmap.max_combo}\n${Number((recentInfo.scores[i].acc).toFixed(2))}% \`[ ${recentInfo.scores[i].n300} • ${recentInfo.scores[i].n100} • ${recentInfo.scores[i].n50} • ${recentInfo.scores[i].nmiss} ]\`\n${timeAgo(recentInfo.scores[i].play_time)}\n\n`;
                    }
                }

                const embed = new MessageEmbed({
                    color: '#0099ff',
                    author: {
                        name: `Top 5 most recent osu!AutoPilot plays for ${playerInfo.player.info.name} sorted by pp`,
                        icon_url: `${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}`
                    },
                    description: description,
                    thumbnail: {
                        url: `${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}`
                    }
                })

                return message.reply({embeds: [embed]});

            } else if (parameters.contains == true && parameters.hasUser == false){
                    const userID = message.author.id;
                    const userSchema = await osuUser.findOne({
                        userID
                    })

                    if (!userSchema) return message.channel.send(`You have not linked your osu account. Use \`${botConfig.prefix}link <username>\` to link your account.`);

                    const { data: playerInfo } = await osuApi().get('get_player_info', {
                        params: {
                            name: userSchema.username,
                            scope: 'all'
                        }
                        }).catch(err => message.reply(`Could not find user \`${username}\`, check your spelling.`));
                
                    if(playerInfo == undefined || playerInfo.length == 0) return;

                    const { data: recentInfo } = await osuApi().get('get_player_scores', {
                        params: {
                            id: playerInfo.player.info.id,
                            scope: 'recent',
                            limit: 100,
                            mode: 8,
                            include_failed: false
                        }
                    }).catch(err => message.reply("Could not find recent plays. Maybe you don't have any recent play."));

                    if (!recentInfo.scores.length || recentInfo.scores.length == 0) return message.reply("Could not find recent plays. Maybe you don't have any recent play.");
                    for(let i = 0; i < recentInfo.scores.length; i++) {
                        recentInfo.scores[i].id = i;
                    }
                    recentInfo.scores.sort(function(a, b){return b.pp-a.pp});
                    let description = "";
                    if(recentInfo.scores.length >= 5){
                        for (let i = 0; i < 5; i++) {
                            const { data: modsFixed } = await banchoApi().get('get_beatmaps', {
                                params: {
                                    k: botConfig.apikey,
                                    b: recentInfo.scores[i].beatmap.id,
                                    mods: modReplace(recentInfo.scores[i].mods)
                                }
                            });

                            description = description+`${recentInfo.scores[i].id}. ${stars(modsFixed[0].difficultyrating, recentInfo.scores[i].beatmap.mode)} **[${recentInfo.scores[i].beatmap.title}](https://osu.ppy.sh/b/${recentInfo.scores[i].beatmap.id})** (${Number((parseFloat(modsFixed[0].difficultyrating)).toFixed(2))}★) \`${modsEnum({mod: recentInfo.scores[i].mods}).mod_text}\` • ${scoreFormat(recentInfo.scores[i].score)}\n${ranks(recentInfo.scores[i].grade)} *${recentInfo.scores[i].beatmap.version}* • **${Number((recentInfo.scores[i].pp).toFixed(2))}pp** • x${recentInfo.scores[i].max_combo}/${recentInfo.scores[i].beatmap.max_combo}\n${Number((recentInfo.scores[i].acc).toFixed(2))}% \`[ ${recentInfo.scores[i].n300} • ${recentInfo.scores[i].n100} • ${recentInfo.scores[i].n50} • ${recentInfo.scores[i].nmiss} ]\`\n${timeAgo(recentInfo.scores[i].play_time)}\n\n`;
                        }
                    } else {
                        for (let i = 0; i < recentInfo.scores.length; i++) {
                            const { data: modsFixed } = await banchoApi().get('get_beatmaps', {
                                params: {
                                    k: botConfig.apikey,
                                    b: recentInfo.scores[i].beatmap.id,
                                    mods: modReplace(recentInfo.scores[i].mods)
                                }
                            });

                            description = description+`${recentInfo.scores[i].id}. ${stars(modsFixed[0].difficultyrating, recentInfo.scores[i].beatmap.mode)} **[${recentInfo.scores[i].beatmap.title}](https://osu.ppy.sh/b/${recentInfo.scores[i].beatmap.id})** (${Number((parseFloat(modsFixed[0].difficultyrating)).toFixed(2))}★) \`${modsEnum({mod: recentInfo.scores[i].mods}).mod_text}\` • ${scoreFormat(recentInfo.scores[i].score)}\n${ranks(recentInfo.scores[i].grade)} *${recentInfo.scores[i].beatmap.version}* • **${Number((recentInfo.scores[i].pp).toFixed(2))}pp** • x${recentInfo.scores[i].max_combo}/${recentInfo.scores[i].beatmap.max_combo}\n${Number((recentInfo.scores[i].acc).toFixed(2))}% \`[ ${recentInfo.scores[i].n300} • ${recentInfo.scores[i].n100} • ${recentInfo.scores[i].n50} • ${recentInfo.scores[i].nmiss} ]\`\n${timeAgo(recentInfo.scores[i].play_time)}\n\n`;
                        }
                    }

                    const embed = new MessageEmbed({
                        color: '#0099ff',
                        author: {
                            name: `Top 5 most recent osu!AutoPilot plays for ${playerInfo.player.info.name} sorted by pp`,
                            icon_url: `${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}`
                        },
                        description: description,
                        thumbnail: {
                            url: `${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}`
                        }
                    })

                    return message.reply({embeds: [embed]});
            } else {
                let username = args.join(' ').replace(/ /g, "_");
                const { data: playerInfo } = await osuApi().get('get_player_info', {
                    params: {
                        name: username,
                        scope: 'all'
                    }
                    }).catch(err => message.reply(`Could not find user \`${username}\`, check your spelling.`));
                
                if(playerInfo == undefined || playerInfo.length == 0) return;

                const { data: recentInfo } = await osuApi().get('get_player_scores', {
                    params: {
                        id: playerInfo.player.info.id,
                        scope: 'recent',
                        limit: 1,
                        mode: 8,
                    }
                }).catch(err => message.reply("Could not find recent plays. Maybe the user doesn't have any recent play."));

                if (!recentInfo.scores.length || recentInfo.scores.length == 0) return message.reply("Could not find recent plays. Maybe the user doesn't have any recent play.");

                const { data: modsFixed } = await banchoApi().get('get_beatmaps', {
                    params: {
                        k: botConfig.apikey,
                        b: recentInfo.scores[0].beatmap.id,
                        mods: modReplace(recentInfo.scores[0].mods)
                    }
                });

                const embed = new MessageEmbed({
                    color: '#0099ff',
                    author: {
                        name: `Most recent osu!AutoPilot play for ${playerInfo.player.info.name}`,
                        icon_url: `${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}`
                    },
                    description: `∷ ${stars(modsFixed[0].difficultyrating, recentInfo.scores[0].beatmap.mode)} **[${recentInfo.scores[0].beatmap.title}](https://osu.ppy.sh/beatmapsets/${recentInfo.scores[0].beatmap.set_id}#osu/${recentInfo.scores[0].beatmap.id})** (${Number((parseFloat(modsFixed[0].difficultyrating)).toFixed(2))}★) \`${modsEnum({mod: recentInfo.scores[0].mods}).mod_text}\` • ${scoreFormat(recentInfo.scores[0].score)}\n${ranks(recentInfo.scores[0].grade)} *${recentInfo.scores[0].beatmap.version}* • **${Number((recentInfo.scores[0].pp).toFixed(2))}pp** • x${recentInfo.scores[0].max_combo}/${recentInfo.scores[0].beatmap.max_combo}\n${Number((recentInfo.scores[0].acc).toFixed(2))}% \`[ ${recentInfo.scores[0].n300} • ${recentInfo.scores[0].n100} • ${recentInfo.scores[0].n50} • ${recentInfo.scores[0].nmiss} ]\``,
                    thumbnail: {
                        url: `https://assets.ppy.sh/beatmaps/${recentInfo.scores[0].beatmap.set_id}/covers/list@2x.jpg`
                    }
                })
                
                if(recentInfo.scores[0].grade == "F") {
                    embed.setFooter({ text: `${mapStatus(recentInfo.scores[0].beatmap.status).toString()} • Completed: ${completed(recentInfo.scores[0].time_elapsed, recentInfo.scores[0].beatmap.total_length)}% • ${timeAgo(recentInfo.scores[0].play_time)}`});
                } else {
                    embed.setFooter({ text: `${mapStatus(recentInfo.scores[0].beatmap.status).toString()} • ${timeAgo(recentInfo.scores[0].play_time)}`});
                }

                return message.reply({embeds: [embed]});
            }
        }
    }
}