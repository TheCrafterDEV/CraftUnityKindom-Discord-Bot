import { SlashCommandBuilder, ChannelType, PermissionsBitField } from 'discord.js';
import { status } from 'minecraft-server-util';
import config from '../config.json' with { type: 'json' };

let statusChannelId = null;

export const data = new SlashCommandBuilder()
    .setName('minecraft-status')
    .setDescription('Erstellt einen Voice-Channel mit der aktuellen Spieleranzahl');

export async function execute(interaction) {
    const guild = interaction.guild;

    // Channel erstellen mit Startwert 0
    const channel = await guild.channels.create({
        name: '🟢 Online Spieler [0]',
        type: ChannelType.GuildVoice,
        permissionOverwrites: [{
            id: guild.roles.everyone,
            deny: [PermissionsBitField.Flags.Connect],
        }],
    });

    statusChannelId = channel.id;

    await interaction.reply({ content: `✅ Channel erstellt: ${channel.name}`, ephemeral: true });

    // Intervall alle 10 Sekunden (10000ms)
    setInterval(async () => {
        const voiceChannel = await interaction.client.channels.fetch(statusChannelId).catch(() => null);
        if (!voiceChannel) return;

        try {
            const result = await status(config.mcServer, config.mcPort);
            const count = result?.players?.online ?? 0;
            await voiceChannel.setName(`🟢 Online Spieler [${count}]`);
        } catch (err) {
            await voiceChannel.setName('Spieler Anzahl = keine Verbindung');
        }
    }, 10 * 1000);
}
