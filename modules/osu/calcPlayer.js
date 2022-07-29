const std_pp_calc = require('./stdCalc')
const axios = require('axios')
const modReplace = require('./modReplace')
const modsEnum = require('./modsEnum')
const beatmapParser = require('../general/parser')
const botConfig = require('../../config.json')
const banchoApi = require('../api/banchoApi')
const osuApi = require('../api/osuApi');

module.exports = async (message, user_name, mode) => {
    try {
        let msg = await message.reply('Calculating player skills... **(This may take a while)**');
        const { data: best } = await osuApi().get('get_player_scores', {
            params: {
                name: user_name,
                scope: 'best',
                limit: 50,
                mode: mode
            }
            }).catch(err => message.reply("Could not find best plays. Maybe you don't have any best play.."));
        
        if (!best.scores.length || best.scores.length == 0) return message.reply("Could not find best plays. Maybe you don't have any best play..");
        
        let star_avg = 0, aim_avg = 0, speed_avg = 0, acc_avg = 0;
        let bpm_avg = 0, cs_avg = 0, ar_avg = 0, od_avg = 0, hp_avg = 0, timetotal_avg = 0, timedrain_avg = 0;
        let calc_count = 50;
        let mod_avg = [];

        if(best.scores.length < 50){
            msg.delete();
            return {star_avg: star_avg, aim_avg: aim_avg, speed_avg: speed_avg, acc_avg: acc_avg}
        }
        for (let i = 0; i < 50; i++) {
            const { data: beatmapData } = await banchoApi().get('get_beatmaps', {
                params: {
                    k: botConfig.apikey,
                    b: best.scores[i].beatmap.id,
                    mods: modReplace(best.scores[i].mods)
                }
            }).catch(err => console.error(err))

            // Beatmap correct data
            beatmapData[0].bpm = parseFloat(beatmapData[0].bpm)
            beatmapData[0].diff_size = parseFloat(beatmapData[0].diff_size)
            beatmapData[0].diff_approach = parseFloat(beatmapData[0].diff_approach)
            beatmapData[0].diff_overall = parseFloat(beatmapData[0].diff_overall)
            beatmapData[0].diff_drain = parseFloat( beatmapData[0].diff_drain)
            beatmapData[0].max_combo = parseInt(beatmapData[0].max_combo)
            beatmapData[0].difficultyrating = parseFloat(beatmapData[0].difficultyrating)
            if(mode == 0 || mode == 4){
                let parser, map_info;
                parser = await beatmapParser({beatmap_id: best.scores[i].beatmap.id});
                map_info = std_pp_calc({parser: parser, mod_num: parseInt(best.scores[i].mods), mode: 'acc'})

                let acc = (100.0 * (6 * best.scores[i].n300 + 2 * best.scores[i].n100 + best.scores[i].n50)) / (6 * (best.scores[i].n50 + best.scores[i].n100 + best.scores[i].n300 + best.scores[i].nmiss));

                // Calc skill
                let star_skill = map_info.star.total
                let aim_skill = (map_info.star.aim * (Math.pow(parseInt(beatmapData[0].diff_size), 0.1) / Math.pow(4, 0.1)))*2
                let speed_skill = (map_info.star.speed * (Math.pow(parseFloat(beatmapData[0].bpm), 0.09) / Math.pow(180, 0.09)) * (Math.pow( parseInt(beatmapData[0].diff_approach), 0.1) / Math.pow(6, 0.1)))*2
                let unbalance_limit = (Math.abs(aim_skill - speed_skill)) > (Math.pow(5, Math.log(aim_skill + speed_skill) / Math.log(1.7))/2940)
                aim_avg += aim_skill
                speed_avg += speed_skill
                if ((modsEnum({mod: best.scores[i].mods}).mod_text.toString().includes('DT') || (modsEnum({mod: best.scores[i].mods}).mod_text.toString().includes('NC')) && unbalance_limit)) {
                    aim_skill /= 1.06
                    speed_skill /= 1.06
                }
                let acc_skill = (Math.pow(aim_skill / 2, (Math.pow(acc, 2.5)/Math.pow(100, 2.5)) * (0.083 * Math.log10(map_info.star.nsingles*900000000) * (Math.pow(1.42, parseInt(best.scores[i].max_combo)/parseInt(map_info.max_combo)) - 0.3) )) + Math.pow(speed_skill / 2, (Math.pow(acc, 2.5)/ Math.pow(100, 2.5)) * (0.0945 * Math.log10(map_info.star.nsingles*900000000) * (Math.pow(1.35, parseInt(best.scores[i].max_combo)/parseInt(map_info.max_combo)) - 0.3)))) * (Math.pow(beatmapData[0].diff_overall, 0.02) / Math.pow(6, 0.02)) * (Math.pow(beatmapData[0].diff_drain, 0.02) / (Math.pow(6, 0.02)))
                
                if ((modsEnum({mod: best.scores[i].mods}).mod_text.toString().includes('FL'))) {
                    acc_skill *= (0.095 * Math.log10(map_info.star.nsingles*900000000))
                }
                // Set number to var
                star_avg += star_skill
                if (acc_skill !== Infinity) acc_avg += acc_skill

            } else {
                star_avg += beatmapData[0].difficultyrating;
                if (mode == 1) {
                    let acc = Number((0.5 * best.scores[i].n100 + best.scores[i].n300) / (best.scores[i].n300 + best.scores[i].n100 + best.scores[i].nmiss) * 100)
                    let speed_skill = Math.pow(beatmapData[0].difficultyrating/1.1, Math.log(beatmapData[0].bpm)/Math.log(beatmapData[0].difficultyrating*20))
                    let acc_skill = Math.pow(beatmapData[0].difficultyrating, (Math.pow(acc, 3)/Math.pow(100, 3)) * 1.05) * (Math.pow(beatmapData[0].diff_overall, 0.02) / Math.pow(6, 0.02)) * (Math.pow(beatmapData[0].diff_drain, 0.02) / (Math.pow(5, 0.02)))
                    speed_avg += speed_skill
                    if (acc_skill !== Infinity) acc_avg += acc_skill
                } else if (mode == 2) {
                    let acc = Number((best.scores[i].n50 + best.scores[i].n100 + best[i].best.scores[i].n300) / (best.scores[i].nkatu + best.scores[i].nmiss + best.scores[i].n50 + best.scores[i].n100 + best.scores[i].n300) * 100) 
                    let aim_skill = Math.pow(beatmapData[0].difficultyrating, Math.log(beatmapData[0].bpm)/Math.log(beatmapData[0].difficultyrating*20)) * (Math.pow(beatmapData[0].diff_size, 0.1) / Math.pow(4, 0.1))
                    let acc_skill = Math.pow(beatmapData[0].difficultyrating, (Math.pow(acc, 3.5)/Math.pow(100, 3.5)) * 1.1) * (Math.pow(beatmapData[0].diff_overall, 0.02) / Math.pow(6, 0.02)) * (Math.pow(beatmapData[0].diff_drain, 0.02) / (Math.pow(5, 0.02)))
                    aim_avg += aim_skill
                    if (acc_skill !== Infinity) acc_avg += acc_skill
                } else if (mode == 3) {
                    let acc = Number((50 * best.scores[i].n50 + 100 * best.scores[i].n100 + 200 * best.scores[i].nkatu + 300 * (best.scores[i].n300 + best.scores[i].ngeki)) / (300 * (best.scores[i].nmiss + best.scores[i].n50 + best.scores[i].n100 + best.scores[i].nkatu + best.scores[i].n300 + best.scores[i].ngeki)) * 100)
                    let aim_skill = Math.pow(beatmapData[0].difficultyrating/1.1, Math.log(beatmapData[0].bpm)/Math.log(beatmapData[0].difficultyrating*20))
                    let speed_skill = Math.pow(beatmapData[0].difficultyrating/1.1, Math.log(beatmapData[0].bpm)/Math.log(beatmapData[0].difficultyrating*20))
                    let acc_skill = Math.pow(beatmapData[0].difficultyrating, (Math.pow(acc, 3)/Math.pow(100, 3)) * 1.05) * (Math.pow(beatmapData[0].diff_overall, 0.02) / Math.pow(6, 0.02)) * (Math.pow(beatmapData[0].diff_drain, 0.02) / (Math.pow(5, 0.02)))
                    aim_avg += aim_skill
                    speed_avg += speed_skill
                    if (acc_skill !== Infinity) acc_avg += acc_skill
                }
            }

            bpm_avg += beatmapData[0].bpm
            cs_avg += beatmapData[0].diff_size
            ar_avg += beatmapData[0].diff_approach
            od_avg += beatmapData[0].diff_overall
            hp_avg += beatmapData[0].diff_drain
            timetotal_avg += beatmapData[0].total_length
            timedrain_avg += beatmapData[0].hit_length
            mod_avg.push(modsEnum({mod: parseInt(best.scores[i].mods)}).mod_text)
        }
        msg.delete();
        return {star_avg: star_avg, aim_avg: aim_avg, speed_avg: speed_avg*1.03, acc_avg: acc_avg, 
                bpm_avg: bpm_avg, cs_avg: cs_avg, ar_avg: ar_avg, od_avg: od_avg, hp_avg: hp_avg, 
                timetotal_avg: timetotal_avg, timedrain_avg: timedrain_avg, mod_avg: mod_avg,
                calc_count: calc_count}
    } catch (err) {
        console.log(err)
    }
}