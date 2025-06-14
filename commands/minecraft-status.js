import { SlashCommandBuilder, ChannelType, PermissionsBitField } from 'discord.js';
import { status } from 'minecraft-server-util';
import config from '../config.json' with { type: 'json' };

let statusChannelId = null;

export const data = new SlashCommandBuilder()
    .setName('minecraft-status')
    .setDescription('Creates a voice channel with the current number of players');

export async function execute(interaction) {
    const guild = interaction.guild;

    const channel = await guild.channels.create({
        name: '🟢 Online Player [0]',
        type: ChannelType.GuildVoice,
        permissionOverwrites: [{
            id: guild.roles.everyone,
            deny: [PermissionsBitField.Flags.Connect],
        }],
    });

    statusChannelId = channel.id;

    await interaction.reply({ content: `✅ Create channelt: ${channel.name}`, ephemeral: true });

    setInterval(async () => {
        const voiceChannel = await interaction.client.channels.fetch(statusChannelId).catch(() => null);
        if (!voiceChannel) return;

        try {
            const result = await status(config.mcServer, config.mcPort);
            const count = result?.players?.online ?? 0;
            await voiceChannel.setName(`🟢 Online Player [${count}]`);
        } catch (err) {
            await voiceChannel.setName('Player count = no connection');
        }
    }, 10 * 1000);
}
