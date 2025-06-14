const { SlashCommandBuilder, EmbedBuilder, Events, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, './welcomeChannels.json');

function loadWelcomeChannels() {
    if (!fs.existsSync(dbPath)) return {};
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveWelcomeChannels(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome-channel')
        .setDescription('Sets the channel where new members are welcomed.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('welcome channel')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)),

    async execute(interaction) {
        const channel = interaction.options.getChannel('kanal');
        const guildId = interaction.guild.id;

        const data = loadWelcomeChannels();
        data[guildId] = channel.id;
        saveWelcomeChannels(data);

        await interaction.reply(`✅ Welcome channel has been set to <#${channel.id}>!`);
    },

    // Event Listener
    name: Events.GuildMemberAdd,
    async executeEvent(member) {
        const data = loadWelcomeChannels();
        const channelId = data[member.guild.id];
        if (!channelId) return;

        const channel = member.guild.channels.cache.get(channelId);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('Willkommen auf CraftUnityKindom!')
            .setDescription(`Willkommen ${member.user}! Dieses Server ist ein reiner Minecraft Discord Server.\nBitte lese dir zuerst die Regeln durch und bestätige sie dann damit du weißt welche Regeln bei uns gelten.\nWenn du dies getan hast kannst du voll durchstarten!`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({
                text: 'CraftUnityKindom Team',
                iconURL: member.client.user.displayAvatarURL()
            })
            .setTimestamp();

        channel.send({ embeds: [embed] }).catch(console.error);
    }
};
