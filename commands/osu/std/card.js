const { Client, Message, MessageEmbed } = require('discord.js');
const jimp = require('jimp');
const text2png = require('text2png');
const osuApi = require('../../../modules/api/osuApi');
const calcPlayer = require('../../../modules/osu/calcPlayer');
const botConfig = require('../../../config.json');
const osuUser = require('../../../models/osuUser');

module.exports = {
    name: 'card',
    aliases: ['osucard'],
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
    
            let {star_avg, aim_avg, speed_avg, acc_avg,
                finger_control_avg, calc_count} = await calcPlayer(message, userSchema.username, 0)

            if(star_avg == 0 && aim_avg == 0 && speed_avg == 0 && acc_avg == 0) return message.reply('You dont have enough scores to calculate card');
            star_avg = Number(star_avg / calc_count)
            aim_avg = Number(aim_avg / calc_count * 100).toFixed(0)
            speed_avg = Number(speed_avg / calc_count * 100).toFixed(0)
            acc_avg = Number(acc_avg / calc_count * 100).toFixed(0)
            finger_control_avg = Number(finger_control_avg/ calc_count * 100).toFixed(0)
            // Process image
            let card_name = ['common_osu', 'rare_osu', 'elite_osu', 'super_rare_osu', 'ultra_rare_osu', 'master_osu']
            let get_card_name = Number(acc_avg >= 300) + Number(acc_avg >= 525) + Number(acc_avg >= 700) + Number(acc_avg >= 825) + Number(acc_avg >= 900)
            //
            let card =  await jimp.read(`./assets/osu_card/card/${card_name[get_card_name]}.png`)
            let fullstar = await jimp.read('./assets/osu_card/star/full_star.png')
            let halfstar = await jimp.read('./assets/osu_card/star/half_star.png');
            // Special card
            let special_plr, card_check = false;
            let special_info = [{'id': '11786864', 'name': 'cookiezi', 'card': true, 'star': 'chocomint'},
                                {'id': '259972','mode': 'mania', 'name': 'jakads'},]
            let check_plr = special_info.find(p => p.id == playerInfo.player.info.id)
            if (check_plr) {
                special_plr = check_plr.name
                if (check_plr?.card) {
                    card_check = true
                    card = await jimp.read(`./assets/osu_card/card/${check_plr.id}.png`)
                } else {
                    card = await jimp.read('./assets/osu_card/card/legendary_osu.png')
                }
                if (check_plr?.star) {
                    fullstar = await jimp.read(`./assets/osu_card/star/full_${check_plr.star}.png`)
                    halfstar = await jimp.read(`./assets/osu_card/star/half_${check_plr.star}.png`)
                }
            }
            //
            let pfp = await jimp.read(`${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}`);
            pfp.resize(320,320)
            card.composite(pfp, 40,110)
            // Get mode icon
            const icon_path = './assets/osu_card/icon/'
            const path_suffix = 'akatsuki_std'
            let mode_icon = await jimp.read(`${icon_path}${path_suffix}.png`)
            mode_icon.resize(80,80)
            card.composite(mode_icon, 20, 20)
            // Get username
            let name_color = 'white'
            let local_font = {localFontPath: './assets/font/Somatic.otf', localFontName: 'Somatic'}
            let nametext = await jimp.read(text2png(playerInfo.player.info.name, {
                color: name_color,
                font: '160px Somatic',
                lineSpacing: 15,
                ...local_font}))
            let nametextw = nametext.getWidth()
            let nametexth = nametext.getHeight()
            let max_name_h = (playerInfo.player.info.name.search(/[gjpqy]/gm) > -1) ? 35 : 27
            if (nametextw / 220 >= nametexth / max_name_h) {
                nametext.resize(220, jimp.AUTO)
            } else {
                nametext.resize(jimp.AUTO, max_name_h)
            }
            nametext.contain(220, max_name_h, jimp.HORIZONTAL_ALIGN_CENTER)
            let nametext_shadow = {size: 1, opacity: 0.35, x: 2, y: 2, blur: 1}
            let nametext_cv = new jimp(nametext.getWidth() * 1.25, nametext.getHeight() * 1.25, 0x00000000)
            nametext_cv.composite(nametext, 0, 0).shadow(nametext_shadow)
            card.composite(nametext_cv, 150, 50)
            // Stat
            function card_stat(onlycard) {
                let skill_holder = [aim_avg, speed_avg, acc_avg]
                let skill_name_holder = ['Aim', 'Speed', 'Accuracy', 'Finger Control']
                let modenum_skill = [{skill: [0,1,2]}, {skill: [1,2]}, {skill: [0,2]}, {skill: [0,1,2]}]
                let skillname = '', skillnumber = '', stat_number_x = 170;
                if (onlycard) {
                    for (let num of modenum_skill[0].skill) {
                        skillname += `${skill_name_holder[num]}: ${skill_holder[num]}\n`;
                    }
                    return {skillname: skillname, stat_number_x: stat_number_x}
                } else {
                    for (let num of modenum_skill[0].skill) {
                        skillname += `${skill_name_holder[num]}:\n`;
                        skillnumber += `${skill_holder[num]}\n`
                    }
                    return {skillname: skillname, skillnumber: skillnumber, stat_number_x: stat_number_x}
                }
            }
            let skillname = '', skillnumber = '', stat_number_x = 0;
            if (special_plr == undefined || !card_check) {
                skillname = card_stat(true).skillname
                
            } else {
                skillname = card_stat(false).skillname
                skillnumber = card_stat(false).skillnumber
                stat_number_x = card_stat(false).stat_number_x
            }
            let stat_color = 'white'
            let stat_shadow = {size: 1, opacity: 0.35, x: 2, y: 2, blur: 1}
            if (special_plr == 'kahli') {
                stat_color = '#e0ffff'
                stat_shadow.opacity = 0.75
            }
            let text_line_spacing = 8
            if (special_plr == undefined || !card_check) {
                let stattext = await jimp.read(text2png(skillname, {
                    color: stat_color,
                    font: '28px Somatic',
                    lineSpacing: text_line_spacing,
                    textAlign: 'center',
                    ...local_font}))
                let stattext_cv = new jimp(stattext.getWidth() * 1.1, stattext.getHeight() * 1.1, 0x00000000)
                stattext_cv.composite(stattext, 0, 0).shadow(stat_shadow)
                card.composite(stattext_cv, 104, 444)
            } else {
                let stattext = await jimp.read(text2png(skillname, {
                    color: stat_color,
                    font: '28px Somatic',
                    lineSpacing: text_line_spacing,
                    textAlign: 'right',
                    ...local_font}))
                let stattext_cv = new jimp(stattext.getWidth() * 1.1, stattext.getHeight() * 1.1, 0x00000000)
                stattext_cv.composite(stattext, 0, 0).shadow(stat_shadow)
                card.composite(stattext_cv, 24, 444)
                let statnumber = await jimp.read(text2png(skillnumber, {
                    color: stat_color,
                    font: '28px Somatic',
                    lineSpacing: 15.2,
                    textAlign: 'left',
                    ...local_font}))
                let statnumber_cv = new jimp(stattext.getWidth() * 1.1, stattext.getHeight() * 1.1, 0x00000000)
                statnumber_cv.composite(statnumber, 0, 0).shadow(stat_shadow)
                card.composite(statnumber_cv, stat_number_x, 444)
            }
            // Star
            let star_width = 32
            let width = (Math.floor(star_avg) + ((star_avg % 1) >= 0.5 ? 1 : 0)) * star_width + 2
            let starholder = await new jimp(width, 33, 0x00000000)
            for (let i = 0; i < Math.ceil(star_avg); i++) {
                if (i+1 > Math.floor(star_avg)) {
                    starholder.composite(halfstar, i*star_width, 0)
                } else {
                    starholder.composite(fullstar, i*star_width, 0)
                }
            }
            if (special_plr == undefined || !card_check) {
                starholder.contain(383,33, jimp.HORIZONTAL_ALIGN_CENTER)
                card.composite(starholder, 10, 551)
            } else {
                starholder.contain(240,27, jimp.HORIZONTAL_ALIGN_CENTER)
                card.composite(starholder, 15, 556)
            }
            message.reply({
                files: [{
                    attachment: await card.getBufferAsync(jimp.MIME_PNG),
                    name: 'card.png'
                }]
            });
        } else {
            let username = args.join('_');
            const { data: playerInfo } = await osuApi().get('get_player_info', {
                params: {
                    name: username,
                    scope: 'all'
                }
                }).catch(err => message.reply(`Could not find user \`${username}\`, check your spelling.`));
            
            if(playerInfo == undefined || playerInfo.length == 0) return;

            let {star_avg, aim_avg, speed_avg, acc_avg,
                finger_control_avg, calc_count} = await calcPlayer(message, username, 0)

                if(star_avg == 0 && aim_avg == 0 && speed_avg == 0 && acc_avg == 0) return message.reply('User doesnt have enough scores to calculate card');
            star_avg = Number(star_avg / calc_count)
            aim_avg = Number(aim_avg / calc_count * 100).toFixed(0)
            speed_avg = Number(speed_avg / calc_count * 100).toFixed(0)
            acc_avg = Number(acc_avg / calc_count * 100).toFixed(0)
            finger_control_avg = Number(finger_control_avg/ calc_count * 100).toFixed(0)
            // Process image
            let card_name = ['common_osu', 'rare_osu', 'elite_osu', 'super_rare_osu', 'ultra_rare_osu', 'master_osu']
            let get_card_name = Number(acc_avg >= 300) + Number(acc_avg >= 525) + Number(acc_avg >= 700) + Number(acc_avg >= 825) + Number(acc_avg >= 900)
            //
            let card =  await jimp.read(`./assets/osu_card/card/${card_name[get_card_name]}.png`)
            let fullstar = await jimp.read('./assets/osu_card/star/full_star.png')
            let halfstar = await jimp.read('./assets/osu_card/star/half_star.png');
            // Special card
            let special_plr, card_check = false;
            let special_info = [{'id': '11786864', 'name': 'cookiezi', 'card': true, 'star': 'chocomint'},
                                {'id': '259972','mode': 'mania', 'name': 'jakads'},]
            let check_plr = special_info.find(p => p.id == playerInfo.player.info.id)
            if (check_plr) {
                special_plr = check_plr.name
                if (check_plr?.card) {
                    card_check = true
                    card = await jimp.read(`./assets/osu_card/card/${check_plr.id}.png`)
                } else {
                    card = await jimp.read('./assets/osu_card/card/legendary_osu.png')
                }
                if (check_plr?.star) {
                    fullstar = await jimp.read(`./assets/osu_card/star/full_${check_plr.star}.png`)
                    halfstar = await jimp.read(`./assets/osu_card/star/half_${check_plr.star}.png`)
                }
            }
            //
            let pfp = await jimp.read(`${botConfig.server.avatarurl}${playerInfo.player.info.id}?${Math.floor(Math.random()*9999)}`);
            pfp.resize(320,320)
            card.composite(pfp, 40,110)
            // Get mode icon
            const icon_path = './assets/osu_card/icon/'
            const path_suffix = 'akatsuki_std'
            let mode_icon = await jimp.read(`${icon_path}${path_suffix}.png`)
            mode_icon.resize(80,80)
            card.composite(mode_icon, 20, 20)
            // Get username
            let name_color = 'white'
            let local_font = {localFontPath: './assets/font/Somatic.otf', localFontName: 'Somatic'}
            let nametext = await jimp.read(text2png(playerInfo.player.info.name, {
                color: name_color,
                font: '160px Somatic',
                lineSpacing: 15,
                ...local_font}))
            let nametextw = nametext.getWidth()
            let nametexth = nametext.getHeight()
            let max_name_h = (playerInfo.player.info.name.search(/[gjpqy]/gm) > -1) ? 35 : 27
            if (nametextw / 220 >= nametexth / max_name_h) {
                nametext.resize(220, jimp.AUTO)
            } else {
                nametext.resize(jimp.AUTO, max_name_h)
            }
            nametext.contain(220, max_name_h, jimp.HORIZONTAL_ALIGN_CENTER)
            let nametext_shadow = {size: 1, opacity: 0.35, x: 2, y: 2, blur: 1}
            let nametext_cv = new jimp(nametext.getWidth() * 1.25, nametext.getHeight() * 1.25, 0x00000000)
            nametext_cv.composite(nametext, 0, 0).shadow(nametext_shadow)
            card.composite(nametext_cv, 150, 50)
            // Stat
            function card_stat(onlycard) {
                let skill_holder = [aim_avg, speed_avg, acc_avg]
                let skill_name_holder = ['Aim', 'Speed', 'Accuracy', 'Finger Control']
                let modenum_skill = [{skill: [0,1,2]}, {skill: [1,2]}, {skill: [0,2]}, {skill: [0,1,2]}]
                let skillname = '', skillnumber = '', stat_number_x = 170;
                if (onlycard) {
                    for (let num of modenum_skill[0].skill) {
                        skillname += `${skill_name_holder[num]}: ${skill_holder[num]}\n`;
                    }
                    return {skillname: skillname, stat_number_x: stat_number_x}
                } else {
                    for (let num of modenum_skill[0].skill) {
                        skillname += `${skill_name_holder[num]}:\n`;
                        skillnumber += `${skill_holder[num]}\n`
                    }
                    return {skillname: skillname, skillnumber: skillnumber, stat_number_x: stat_number_x}
                }
            }
            let skillname = '', skillnumber = '', stat_number_x = 0;
            if (special_plr == undefined || !card_check) {
                skillname = card_stat(true).skillname
                
            } else {
                skillname = card_stat(false).skillname
                skillnumber = card_stat(false).skillnumber
                stat_number_x = card_stat(false).stat_number_x
            }
            let stat_color = 'white'
            let stat_shadow = {size: 1, opacity: 0.35, x: 2, y: 2, blur: 1}
            if (special_plr == 'kahli') {
                stat_color = '#e0ffff'
                stat_shadow.opacity = 0.75
            }
            let text_line_spacing = 8
            if (special_plr == undefined || !card_check) {
                let stattext = await jimp.read(text2png(skillname, {
                    color: stat_color,
                    font: '28px Somatic',
                    lineSpacing: text_line_spacing,
                    textAlign: 'center',
                    ...local_font}))
                let stattext_cv = new jimp(stattext.getWidth() * 1.1, stattext.getHeight() * 1.1, 0x00000000)
                stattext_cv.composite(stattext, 0, 0).shadow(stat_shadow)
                card.composite(stattext_cv, 104, 444)
            } else {
                let stattext = await jimp.read(text2png(skillname, {
                    color: stat_color,
                    font: '28px Somatic',
                    lineSpacing: text_line_spacing,
                    textAlign: 'right',
                    ...local_font}))
                let stattext_cv = new jimp(stattext.getWidth() * 1.1, stattext.getHeight() * 1.1, 0x00000000)
                stattext_cv.composite(stattext, 0, 0).shadow(stat_shadow)
                card.composite(stattext_cv, 24, 444)
                let statnumber = await jimp.read(text2png(skillnumber, {
                    color: stat_color,
                    font: '28px Somatic',
                    lineSpacing: 15.2,
                    textAlign: 'left',
                    ...local_font}))
                let statnumber_cv = new jimp(stattext.getWidth() * 1.1, stattext.getHeight() * 1.1, 0x00000000)
                statnumber_cv.composite(statnumber, 0, 0).shadow(stat_shadow)
                card.composite(statnumber_cv, stat_number_x, 444)
            }
            // Star
            let star_width = 32
            let width = (Math.floor(star_avg) + ((star_avg % 1) >= 0.5 ? 1 : 0)) * star_width + 2
            let starholder = await new jimp(width, 33, 0x00000000)
            for (let i = 0; i < Math.ceil(star_avg); i++) {
                if (i+1 > Math.floor(star_avg)) {
                    starholder.composite(halfstar, i*star_width, 0)
                } else {
                    starholder.composite(fullstar, i*star_width, 0)
                }
            }
            if (special_plr == undefined || !card_check) {
                starholder.contain(383,33, jimp.HORIZONTAL_ALIGN_CENTER)
                card.composite(starholder, 10, 551)
            } else {
                starholder.contain(240,27, jimp.HORIZONTAL_ALIGN_CENTER)
                card.composite(starholder, 15, 556)
            }
            message.reply({
                files: [{
                  attachment: await card.getBufferAsync(jimp.MIME_PNG),
                  name: 'card.png'
                }]
            });
        }
    }
}