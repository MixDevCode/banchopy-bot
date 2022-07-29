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
const scoreFormat = require('../../../modules/osu/scoreFormat');
const { Pagination } = require("../../../modules/general/discordjs-button-embed-pagination");


module.exports = {
    name: 'top',
    aliases: ['osutop'],
    description: "Get user's top osu standard plays.",
    usage: 'top [username...]',
    options: [
        "\`Username\`: username of the player.",
        "Play index \`(-i)\`: Get specific play number from top 100. (1-100)",
        "Recent Plays \`(-r)\`: Gets 5 most recent plays in top 100. (no param)",
        "Random Play \`(-rand)\`: Get random play number in top 100. (no param)"
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

            const { data: bestInfo } = await osuApi().get('get_player_scores', {
                params: {
                    id: playerInfo.player.info.id,
                    scope: 'best',
                    limit: 100
                }
                }).catch(err => message.reply("Could not find best plays. Maybe you don't have any best play."));

            if (!bestInfo.scores.length || bestInfo.scores.length == 0) return message.reply("Could not find best plays. Maybe you dont have any best play.");
            
            let description = "";
            let data = [];
            let msg = await message.reply(`Finding best plays for ${playerInfo.player.info.name}... **(This may take a while)**`);
            
            for (let i = 0; i < bestInfo.scores.length; i++) {
                const { data: modsFixed } = await banchoApi().get('get_beatmaps', {
                    params: {
                        k: botConfig.apikey,
                        b: bestInfo.scores[i].beatmap.id,
                        mods: modReplace(bestInfo.scores[i].mods)
                    }
                });
                if (i % 5 == 0 && i != 0) {
                    await msg.edit(`\`${Number((i/bestInfo.scores.length)*100).toFixed(0)}% Completed...\` **(This may take a while)**`);
                    data.push(description);
                    description = "";
                    description += `${bestInfo.scores[i].id}. ${stars(modsFixed[0].difficultyrating, bestInfo.scores[i].beatmap.mode)} **[${bestInfo.scores[i].beatmap.title}](https://osu.ppy.sh/b/${bestInfo.scores[i].beatmap.id})** (${Number((parseFloat(modsFixed[0].difficultyrating)).toFixed(2))}★) \`${modsEnum({mod: bestInfo.scores[i].mods}).mod_text}\` • ${scoreFormat(bestInfo.scores[i].score)}\n${ranks(bestInfo.scores[i].grade)} *${bestInfo.scores[i].beatmap.version}* • **${Number((bestInfo.scores[i].pp).toFixed(2))}pp** • x${bestInfo.scores[i].max_combo}/${bestInfo.scores[i].beatmap.max_combo}\n${Number((bestInfo.scores[i].acc).toFixed(2))}% \`[ ${bestInfo.scores[i].n300} • ${bestInfo.scores[i].n100} • ${bestInfo.scores[i].n50} • ${bestInfo.scores[i].nmiss} ]\`\n${timeAgo(bestInfo.scores[i].play_time)}\n\n`;
                } else {
                    description += `${bestInfo.scores[i].id}. ${stars(modsFixed[0].difficultyrating, bestInfo.scores[i].beatmap.mode)} **[${bestInfo.scores[i].beatmap.title}](https://osu.ppy.sh/b/${bestInfo.scores[i].beatmap.id})** (${Number((parseFloat(modsFixed[0].difficultyrating)).toFixed(2))}★) \`${modsEnum({mod: bestInfo.scores[i].mods}).mod_text}\` • ${scoreFormat(bestInfo.scores[i].score)}\n${ranks(bestInfo.scores[i].grade)} *${bestInfo.scores[i].beatmap.version}* • **${Number((bestInfo.scores[i].pp).toFixed(2))}pp** • x${bestInfo.scores[i].max_combo}/${bestInfo.scores[i].beatmap.max_combo}\n${Number((bestInfo.scores[i].acc).toFixed(2))}% \`[ ${bestInfo.scores[i].n300} • ${bestInfo.scores[i].n100} • ${bestInfo.scores[i].n50} • ${bestInfo.scores[i].nmiss} ]\`\n${timeAgo(bestInfo.scores[i].play_time)}\n\n`;
                }
            }

            if (description !== "") {
                data.push(description);
            }

            msg.delete();

            if(data.length > 1) {
                const embeds = data.map((x) => {
                    return new MessageEmbed()
                        .setAuthor({ name: `Top ${bestInfo.scores.length} osu!Standard plays for ${playerInfo.player.info.name}`, iconURL: `${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}` })
                        .setColor("#0099ff")
                        .setDescription(x)
                        .setThumbnail(`${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}`);
                })

                await new Pagination(message, embeds, `Page`).paginate()
            } else {
                const embed = new MessageEmbed({
                    color: '#0099ff',
                    author: {
                        name: `Top 5 osu!Standard plays for ${playerInfo.player.info.name}`,
                        icon_url: `${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}`
                    },
                    description: description,
                    thumbnail: {
                        url: `${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}`
                    }
                })
    
                return message.reply({embeds: [embed]});
            }

        } else {
            const parameters = checkParameter(args, "-r");
            const randomparameters = checkParameter(args, "-rand");
            const indexparameters = checkParameter(args, "-i");
            if (parameters.contains == true && parameters.hasUser == true) {
                let username = checkParameter(args, "-r").args;
                const { data: playerInfo } = await osuApi().get('get_player_info', {
                    params: {
                        name: username,
                        scope: 'all'
                    }
                    }).catch(err => message.reply(`Could not find user \`${username}\`, check your spelling.`));
                
                if(playerInfo == undefined || playerInfo.length == 0) return;

                const { data: bestInfo } = await osuApi().get('get_player_scores', {
                    params: {
                        id: playerInfo.player.info.id,
                        scope: 'best',
                        limit: 100
                    }
                    }).catch(err => message.reply("Could not find best plays. Maybe the user doesn't have any best play..."));
                
                    if (!bestInfo.scores.length || bestInfo.scores.length == 0) return message.reply("Could not find best plays. Maybe the user doesn't have any best play...");
                for(let i = 0; i < bestInfo.scores.length; i++) {
                    bestInfo.scores[i].id = i;
                }
                bestInfo.scores.sort(function(a, b){return new Date(b.play_time) - new Date(a.play_time)});

                let description = "";
                if(bestInfo.scores.length >= 5){
                    for (let i = 0; i < 5; i++) {
                        const { data: modsFixed } = await banchoApi().get('get_beatmaps', {
                            params: {
                                k: botConfig.apikey,
                                b: bestInfo.scores[i].beatmap.id,
                                mods: modReplace(bestInfo.scores[i].mods)
                            }
                        });

                        description = description+`${bestInfo.scores[i].id}. ${stars(modsFixed[0].difficultyrating, bestInfo.scores[i].beatmap.mode)} **[${bestInfo.scores[i].beatmap.title}](https://osu.ppy.sh/b/${bestInfo.scores[i].beatmap.id})** (${Number((parseFloat(modsFixed[0].difficultyrating)).toFixed(2))}★) \`${modsEnum({mod: bestInfo.scores[i].mods}).mod_text}\` • ${scoreFormat(bestInfo.scores[i].score)}\n${ranks(bestInfo.scores[i].grade)} *${bestInfo.scores[i].beatmap.version}* • **${Number((bestInfo.scores[i].pp).toFixed(2))}pp** • x${bestInfo.scores[i].max_combo}/${bestInfo.scores[i].beatmap.max_combo}\n${Number((bestInfo.scores[i].acc).toFixed(2))}% \`[ ${bestInfo.scores[i].n300} • ${bestInfo.scores[i].n100} • ${bestInfo.scores[i].n50} • ${bestInfo.scores[i].nmiss} ]\`\n${timeAgo(bestInfo.scores[i].play_time)}\n\n`;
                    }
                } else {
                    for (let i = 0; i < bestInfo.scores.length; i++) {
                        const { data: modsFixed } = await banchoApi().get('get_beatmaps', {
                            params: {
                                k: botConfig.apikey,
                                b: bestInfo.scores[i].beatmap.id,
                                mods: modReplace(bestInfo.scores[i].mods)
                            }
                        });

                        description = description+`${bestInfo.scores[i].id}. ${stars(modsFixed[0].difficultyrating, bestInfo.scores[i].beatmap.mode)} **[${bestInfo.scores[i].beatmap.title}](https://osu.ppy.sh/b/${bestInfo.scores[i].beatmap.id})** (${Number((parseFloat(modsFixed[0].difficultyrating)).toFixed(2))}★) \`${modsEnum({mod: bestInfo.scores[i].mods}).mod_text}\` • ${scoreFormat(bestInfo.scores[i].score)}\n${ranks(bestInfo.scores[i].grade)} *${bestInfo.scores[i].beatmap.version}* • **${Number((bestInfo.scores[i].pp).toFixed(2))}pp** • x${bestInfo.scores[i].max_combo}/${bestInfo.scores[i].beatmap.max_combo}\n${Number((bestInfo.scores[i].acc).toFixed(2))}% \`[ ${bestInfo.scores[i].n300} • ${bestInfo.scores[i].n100} • ${bestInfo.scores[i].n50} • ${bestInfo.scores[i].nmiss} ]\`\n${timeAgo(bestInfo.scores[i].play_time)}\n\n`;
                    }
                }

                const embed = new MessageEmbed({
                    color: '#0099ff',
                    author: {
                        name: `Top 5 osu!Standard plays for ${playerInfo.player.info.name} sorted by play time`,
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

                    if (!userSchema) return message.reply(`You have not linked your osu account. Use \`${botConfig.prefix}link <username>\` to link your account.`);

                    const { data: playerInfo } = await osuApi().get('get_player_info', {
                        params: {
                            name: userSchema.username,
                            scope: 'all'
                        }
                        }).catch(err => message.reply(`Could not find user \`${username}\`, check your spelling.`));
                
                    if(playerInfo == undefined || playerInfo.length == 0) return;

                    const { data: bestInfo } = await osuApi().get('get_player_scores', {
                        params: {
                        id: playerInfo.player.info.id,
                        scope: 'best',
                        limit: 100,
                        }
                    }).catch(err => message.reply("Could not find best plays. Maybe you don't have any best play."));

                    if (!bestInfo.scores.length || bestInfo.scores.length == 0) return message.reply("Could not find best plays. Maybe you don't have any best play...");
                    for(let i = 0; i < bestInfo.scores.length; i++) {
                        bestInfo.scores[i].id = i;
                    }
                    bestInfo.scores.sort(function(a, b){return new Date(b.play_time) - new Date(a.play_time)});
                    let description = "";
                    if(bestInfo.scores.length >= 5){
                        for (let i = 0; i < 5; i++) {
                            const { data: modsFixed } = await banchoApi().get('get_beatmaps', {
                                params: {
                                    k: botConfig.apikey,
                                    b: bestInfo.scores[i].beatmap.id,
                                    mods: modReplace(bestInfo.scores[i].mods)
                                }
                            });

                            description = description+`${bestInfo.scores[i].id}. ${stars(modsFixed[0].difficultyrating, bestInfo.scores[i].beatmap.mode)} **[${bestInfo.scores[i].beatmap.title}](https://osu.ppy.sh/b/${bestInfo.scores[i].beatmap.id})** (${Number((parseFloat(modsFixed[0].difficultyrating)).toFixed(2))}★) \`${modsEnum({mod: bestInfo.scores[i].mods}).mod_text}\` • ${scoreFormat(bestInfo.scores[i].score)}\n${ranks(bestInfo.scores[i].grade)} *${bestInfo.scores[i].beatmap.version}* • **${Number((bestInfo.scores[i].pp).toFixed(2))}pp** • x${bestInfo.scores[i].max_combo}/${bestInfo.scores[i].beatmap.max_combo}\n${Number((bestInfo.scores[i].acc).toFixed(2))}% \`[ ${bestInfo.scores[i].n300} • ${bestInfo.scores[i].n100} • ${bestInfo.scores[i].n50} • ${bestInfo.scores[i].nmiss} ]\`\n${timeAgo(bestInfo.scores[i].play_time)}\n\n`;
                        }
                    } else {
                        for (let i = 0; i < bestInfo.scores.length; i++) {
                            const { data: modsFixed } = await banchoApi().get('get_beatmaps', {
                                params: {
                                    k: botConfig.apikey,
                                    b: bestInfo.scores[i].beatmap.id,
                                    mods: modReplace(bestInfo.scores[i].mods)
                                }
                            });

                            description = description+`${bestInfo.scores[i].id}. ${stars(modsFixed[0].difficultyrating, bestInfo.scores[i].beatmap.mode)} **[${bestInfo.scores[i].beatmap.title}](https://osu.ppy.sh/b/${bestInfo.scores[i].beatmap.id})** (${Number((parseFloat(modsFixed[0].difficultyrating)).toFixed(2))}★) \`${modsEnum({mod: bestInfo.scores[i].mods}).mod_text}\` • ${scoreFormat(bestInfo.scores[i].score)}\n${ranks(bestInfo.scores[i].grade)} *${bestInfo.scores[i].beatmap.version}* • **${Number((bestInfo.scores[i].pp).toFixed(2))}pp** • x${bestInfo.scores[i].max_combo}/${bestInfo.scores[i].beatmap.max_combo}\n${Number((bestInfo.scores[i].acc).toFixed(2))}% \`[ ${bestInfo.scores[i].n300} • ${bestInfo.scores[i].n100} • ${bestInfo.scores[i].n50} • ${bestInfo.scores[i].nmiss} ]\`\n${timeAgo(bestInfo.scores[i].play_time)}\n\n`;
                        }
                    }

                    const embed = new MessageEmbed({
                        color: '#0099ff',
                        author: {
                            name: `Top 5 osu!Standard plays for ${playerInfo.player.info.name} sorted by play time`,
                            icon_url: `${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}`
                        },
                        description: description,
                        thumbnail: {
                            url: `${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}`
                        }
                    })

                    return message.reply({embeds: [embed]});
            } else if (randomparameters.contains == true && randomparameters.hasUser == true) {
                let username = randomparameters.args;
                const { data: playerInfo } = await osuApi().get('get_player_info', {
                    params: {
                        name: username,
                        scope: 'all'
                    }
                    }).catch(err => message.reply(`Could not find user \`${username}\`, check your spelling.`));
                    
                    if(playerInfo == undefined || playerInfo.length == 0) return;
    
                const { data: bestInfo } = await osuApi().get('get_player_scores', {
                    params: {
                        id: playerInfo.player.info.id,
                        scope: 'best',
                        limit: 100
                    }
                    }).catch(err => message.reply("Could not find best plays. Maybe the user doesn't have any best play.."));
                
                if (!bestInfo.scores.length || bestInfo.scores.length == 0) return message.reply("Could not find rbest plays. Maybe the user doesn't have any best play..");
                
                const randnum = Math.floor(Math.random() * bestInfo.scores.length);

                const { data: modsFixed } = await banchoApi().get('get_beatmaps', {
                    params: {
                        k: botConfig.apikey,
                        b: bestInfo.scores[0].beatmap.id,
                        mods: modReplace(bestInfo.scores[randnum].mods)
                    }
                    }).catch(err => console.log(err));
    
                const embed = new MessageEmbed({
                    color: '#0099ff',
                    author: {
                        name: `Random best osu!Standard play for ${playerInfo.player.info.name}`,
                        icon_url: `${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}`
                    },
                    description: `${bestInfo.scores[randnum].id}. ${stars(modsFixed[0].difficultyrating, bestInfo.scores[randnum].beatmap.mode)} **[${bestInfo.scores[randnum].beatmap.title}](https://osu.ppy.sh/beatmapsets/${bestInfo.scores[randnum].beatmap.set_id}#osu/${bestInfo.scores[randnum].beatmap.id})** (${Number((parseFloat(modsFixed[0].difficultyrating)).toFixed(2))}★) \`${modsEnum({mod: bestInfo.scores[randnum].mods}).mod_text}\` • ${scoreFormat(bestInfo.scores[randnum].score)}\n${ranks(bestInfo.scores[randnum].grade)} *${bestInfo.scores[randnum].beatmap.version}* • **${Number((bestInfo.scores[randnum].pp).toFixed(2))}pp** • x${bestInfo.scores[randnum].max_combo}/${bestInfo.scores[randnum].beatmap.max_combo}\n${Number((bestInfo.scores[randnum].acc).toFixed(2))}% \`[ ${bestInfo.scores[randnum].n300} • ${bestInfo.scores[randnum].n100} • ${bestInfo.scores[randnum].n50} • ${bestInfo.scores[randnum].nmiss} ]\``,
                    thumbnail: {
                        url: `https://assets.ppy.sh/beatmaps/${bestInfo.scores[randnum].beatmap.set_id}/covers/list@2x.jpg`
                    },
                    footer: { 
                        text: `${timeAgo(bestInfo.scores[0].play_time)}`
                    }
                })
                

                return message.reply({embeds: [embed]});

            } else if (randomparameters.contains == true && randomparameters.hasUser == false) {
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
    
                const { data: bestInfo } = await osuApi().get('get_player_scores', {
                    params: {
                        id: playerInfo.player.info.id,
                        scope: 'best',
                        limit: 100
                    }
                    }).catch(err => message.reply("Could not find best plays. Maybe the user doesn't have any best play.."));
                
                if (!bestInfo.scores.length || bestInfo.scores.length == 0) return message.reply("Could not find rbest plays. Maybe the user doesn't have any best play..");
                
                const randnum = Math.floor(Math.random() * bestInfo.scores.length);

                const { data: modsFixed } = await banchoApi().get('get_beatmaps', {
                    params: {
                        k: botConfig.apikey,
                        b: bestInfo.scores[0].beatmap.id,
                        mods: modReplace(bestInfo.scores[randnum].mods)
                    }
                    }).catch(err => console.log(err));
    
                const embed = new MessageEmbed({
                    color: '#0099ff',
                    author: {
                        name: `Random best osu!Standard play for ${playerInfo.player.info.name}`,
                        icon_url: `${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}`
                    },
                    description: `${bestInfo.scores[randnum].id}. ${stars(modsFixed[0].difficultyrating, bestInfo.scores[randnum].beatmap.mode)} **[${bestInfo.scores[randnum].beatmap.title}](https://osu.ppy.sh/beatmapsets/${bestInfo.scores[randnum].beatmap.set_id}#osu/${bestInfo.scores[randnum].beatmap.id})** (${Number((parseFloat(modsFixed[0].difficultyrating)).toFixed(2))}★) \`${modsEnum({mod: bestInfo.scores[randnum].mods}).mod_text}\` • ${scoreFormat(bestInfo.scores[randnum].score)}\n${ranks(bestInfo.scores[randnum].grade)} *${bestInfo.scores[randnum].beatmap.version}* • **${Number((bestInfo.scores[randnum].pp).toFixed(2))}pp** • x${bestInfo.scores[randnum].max_combo}/${bestInfo.scores[randnum].beatmap.max_combo}\n${Number((bestInfo.scores[randnum].acc).toFixed(2))}% \`[ ${bestInfo.scores[randnum].n300} • ${bestInfo.scores[randnum].n100} • ${bestInfo.scores[randnum].n50} • ${bestInfo.scores[randnum].nmiss} ]\``,
                    thumbnail: {
                        url: `https://assets.ppy.sh/beatmaps/${bestInfo.scores[randnum].beatmap.set_id}/covers/list@2x.jpg`
                    },
                    footer: { 
                        text: `${timeAgo(bestInfo.scores[0].play_time)}`
                    }
                })
                

                return message.reply({embeds: [embed]});
            
            } else if (indexparameters.contains == true && indexparameters.hasUser == true) {
                let username = indexparameters.args;
                const { data: playerInfo } = await osuApi().get('get_player_info', {
                    params: {
                        name: username,
                        scope: 'all'
                    }
                    }).catch(err => message.reply(`Could not find user \`${username}\`, check your spelling.`));
                    
                    if(playerInfo == undefined || playerInfo.length == 0) return;
    
                const { data: bestInfo } = await osuApi().get('get_player_scores', {
                    params: {
                        id: playerInfo.player.info.id,
                        scope: 'best',
                        limit: 100
                    }
                    }).catch(err => message.reply("Could not find best plays. Maybe the user doesn't have any best play.."));
                
                if (!bestInfo.scores.length || bestInfo.scores.length == 0) return message.reply("Could not find rbest plays. Maybe the user doesn't have any best play..");
                
                const index = indexparameters.index;

                if(index >= bestInfo.scores.length) return message.reply("You only have " + bestInfo.scores.length + " plays. Please use a number between 1 and " + bestInfo.scores.length + ".");
                if(index < 0) return message.reply("You only have " + bestInfo.scores.length + " plays. Please use a number between 1 and " + bestInfo.scores.length + ".");
                if(isNaN(index)) return message.reply("You must need to specify a number between 1 and " + bestInfo.scores.length + ".");

                const { data: modsFixed } = await banchoApi().get('get_beatmaps', {
                    params: {
                        k: botConfig.apikey,
                        b: bestInfo.scores[0].beatmap.id,
                        mods: modReplace(bestInfo.scores[index].mods)
                    }
                    }).catch(err => console.log(err));
    
                const embed = new MessageEmbed({
                    color: '#0099ff',
                    author: {
                        name: `Top osu!Standard play n° ${index+1} for ${playerInfo.player.info.name}`,
                        icon_url: `${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}`
                    },
                    description: `${bestInfo.scores[index].id}. ${stars(modsFixed[0].difficultyrating, bestInfo.scores[index].beatmap.mode)} **[${bestInfo.scores[index].beatmap.title}](https://osu.ppy.sh/beatmapsets/${bestInfo.scores[index].beatmap.set_id}#osu/${bestInfo.scores[index].beatmap.id})** (${Number((parseFloat(modsFixed[0].difficultyrating)).toFixed(2))}★) \`${modsEnum({mod: bestInfo.scores[index].mods}).mod_text}\` • ${scoreFormat(bestInfo.scores[index].score)}\n${ranks(bestInfo.scores[index].grade)} *${bestInfo.scores[index].beatmap.version}* • **${Number((bestInfo.scores[index].pp).toFixed(2))}pp** • x${bestInfo.scores[index].max_combo}/${bestInfo.scores[index].beatmap.max_combo}\n${Number((bestInfo.scores[index].acc).toFixed(2))}% \`[ ${bestInfo.scores[index].n300} • ${bestInfo.scores[index].n100} • ${bestInfo.scores[index].n50} • ${bestInfo.scores[index].nmiss} ]\``,
                    thumbnail: {
                        url: `https://assets.ppy.sh/beatmaps/${bestInfo.scores[index].beatmap.set_id}/covers/list@2x.jpg`
                    },
                    footer: { 
                        text: `${timeAgo(bestInfo.scores[0].play_time)}`
                    }
                })
                

                return message.reply({embeds: [embed]});

            } else if (indexparameters.contains == true && indexparameters.hasUser == false) {
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
    
                const { data: bestInfo } = await osuApi().get('get_player_scores', {
                    params: {
                        id: playerInfo.player.info.id,
                        scope: 'best',
                        limit: 100
                    }
                    }).catch(err => message.reply("Could not find best plays. Maybe the user doesn't have any best play.."));
                
                if (!bestInfo.scores.length || bestInfo.scores.length == 0) return message.reply("Could not find rbest plays. Maybe the user doesn't have any best play..");
                
                const index = indexparameters.index;

                if(index >= bestInfo.scores.length) return message.reply("You only have " + bestInfo.scores.length + " plays. Please use a number between 1 and " + bestInfo.scores.length + ".");
                if(index < 0) return message.reply("You only have " + bestInfo.scores.length + " plays. Please use a number between 1 and " + bestInfo.scores.length + ".");
                if(isNaN(index)) return message.reply("You must need to specify a number between 1 and " + bestInfo.scores.length + ".");

                const { data: modsFixed } = await banchoApi().get('get_beatmaps', {
                    params: {
                        k: botConfig.apikey,
                        b: bestInfo.scores[0].beatmap.id,
                        mods: modReplace(bestInfo.scores[index].mods)
                    }
                    }).catch(err => console.log(err));
    
                const embed = new MessageEmbed({
                    color: '#0099ff',
                    author: {
                        name: `Top osu!Standard play n° ${index+1} for ${playerInfo.player.info.name}`,
                        icon_url: `${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}`
                    },
                    description: `${bestInfo.scores[index].id}. ${stars(modsFixed[0].difficultyrating, bestInfo.scores[index].beatmap.mode)} **[${bestInfo.scores[index].beatmap.title}](https://osu.ppy.sh/beatmapsets/${bestInfo.scores[index].beatmap.set_id}#osu/${bestInfo.scores[index].beatmap.id})** (${Number((parseFloat(modsFixed[0].difficultyrating)).toFixed(2))}★) \`${modsEnum({mod: bestInfo.scores[index].mods}).mod_text}\` • ${scoreFormat(bestInfo.scores[index].score)}\n${ranks(bestInfo.scores[index].grade)} *${bestInfo.scores[index].beatmap.version}* • **${Number((bestInfo.scores[index].pp).toFixed(2))}pp** • x${bestInfo.scores[index].max_combo}/${bestInfo.scores[index].beatmap.max_combo}\n${Number((bestInfo.scores[index].acc).toFixed(2))}% \`[ ${bestInfo.scores[index].n300} • ${bestInfo.scores[index].n100} • ${bestInfo.scores[index].n50} • ${bestInfo.scores[index].nmiss} ]\``,
                    thumbnail: {
                        url: `https://assets.ppy.sh/beatmaps/${bestInfo.scores[index].beatmap.set_id}/covers/list@2x.jpg`
                    },
                    footer: { 
                        text: `${timeAgo(bestInfo.scores[0].play_time)}`
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
    
                const { data: bestInfo } = await osuApi().get('get_player_scores', {
                    params: {
                        id: playerInfo.player.info.id,
                        scope: 'best',
                        limit: 5
                    }
                    }).catch(err => message.reply("Could not find best plays. Maybe you don't have any best play."));
    
                if (!bestInfo.scores.length || bestInfo.scores.length == 0) return message.reply("Could not find best plays. Maybe you dont have any best play.");
                
                let description = "";
    
                for (let i = 0; i < bestInfo.scores.length; i++) {
                    const { data: modsFixed } = await banchoApi().get('get_beatmaps', {
                        params: {
                            k: botConfig.apikey,
                            b: bestInfo.scores[i].beatmap.id,
                            mods: modReplace(bestInfo.scores[i].mods)
                        }
                    });
    
                    description = description+`${bestInfo.scores[i].id}. ${stars(modsFixed[0].difficultyrating, bestInfo.scores[i].beatmap.mode)} **[${bestInfo.scores[i].beatmap.title}](https://osu.ppy.sh/b/${bestInfo.scores[i].beatmap.id})** (${Number((parseFloat(modsFixed[0].difficultyrating)).toFixed(2))}★) \`${modsEnum({mod: bestInfo.scores[i].mods}).mod_text}\` • ${scoreFormat(bestInfo.scores[i].score)}\n${ranks(bestInfo.scores[i].grade)} *${bestInfo.scores[i].beatmap.version}* • **${Number((bestInfo.scores[i].pp).toFixed(2))}pp** • x${bestInfo.scores[i].max_combo}/${bestInfo.scores[i].beatmap.max_combo}\n${Number((bestInfo.scores[i].acc).toFixed(2))}% \`[ ${bestInfo.scores[i].n300} • ${bestInfo.scores[i].n100} • ${bestInfo.scores[i].n50} • ${bestInfo.scores[i].nmiss} ]\`\n${timeAgo(bestInfo.scores[i].play_time)}\n\n`;
                }
    
                const embed = new MessageEmbed({
                    color: '#0099ff',
                    author: {
                        name: `Top 5 osu!Standard plays for ${playerInfo.player.info.name}`,
                        icon_url: `${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}`
                    },
                    description: description,
                    thumbnail: {
                        url: `${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}`
                    }
                })
    
                return message.reply({embeds: [embed]});
            }
        }
    }
}