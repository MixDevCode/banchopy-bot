const { Client, Message, MessageEmbed } = require('discord.js');
const botConfig = require('../../config.json');
const { glob } = require("glob");
const { promisify } = require("util");
const globPromise = promisify(glob);

module.exports = {
    name: 'help',
    description: 'Get a list of commands or info about an specific command.',
    usage: 'help [command...]',
    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    run: async(client, message, args) => {
        const commandFiles = await globPromise(`${process.cwd()}/commands/**/*.js`);
        if(args[0]){
            const command = args.join(" ");
            var exists = 0;
            commandFiles.map((value) => {
                const file = require(value);
                if(file.name == command){
                    exists = 1;
                    let options = "";
                    let example = "";
                    if(file.options) {
                        options = `\n\n\*\*[Options]\*\*`;
                        file.options.map((value) => {
                            options += "\n"+value;
                        });
                    }
                    if(file.usage.includes("username...")) example = `\n\n\*\*[Example]\*\*\n\`${botConfig.prefix}${file.name} ${message.author.username}\``;
                    const embed = new MessageEmbed({
                        color: '#0099ff',
                        description: `\`\`\`${botConfig.prefix}${file.usage}\`\`\`\n\*\*[Description]\*\*\n${file.description}${options}${example}`
                    })

                    return message.reply({embeds: [embed]});
                }
            });

            if(exists == 0) return message.reply(`No command called \`${command}\` found. Maybe is a spelling error, try again.`);
        } else {
            let general = "";
            let taiko = "";
            let relax = "";
            let mania = "";
            let ctb = "";
            let std = "";
            let autopilot = "";
            commandFiles.map((value) => {
                const file = require(value);
                if(value.includes("server")){
                    general += `\`${file.name}\` `;
                } else if (value.includes("taiko")){
                    taiko += `\`${file.name}\` `;
                } else if (value.includes("relax")){
                    relax += `\`${file.name}\` `;
                } else if (value.includes("mania")){
                    mania += `\`${file.name}\` `;
                } else if (value.includes("ctb")){
                    ctb += `\`${file.name}\` `;
                } else if (value.includes("std")){
                    std += `\`${file.name}\` `;
                } else {
                    autopilot += `\`${file.name}\` `;
                }
            });
            const embed = new MessageEmbed({
                color: '#0099ff',
                author: {
                    name: `Command list for ${client.user.username}:`,
                    icon_url: `${client.user.displayAvatarURL()}`
                },
                description: `\*\*General\*\* - ${general}\n\*\*Osu!Standard\*\* - ${std}\n\*\*Osu!Mania\*\* - ${mania}\n\*\*Osu!Taiko\*\* - ${taiko}\n\*\*Osu!Catch\*\* - ${ctb}\n\*\*Osu!Relax\*\* - ${relax}\n\*\*Osu!AutoPilot\*\* - ${autopilot}\n`,
                footer: {
                    text: `For more details on a specific command: ${botConfig.prefix}help (command)`
                }
            })

            return message.reply({embeds: [embed]});
        }
    }
}