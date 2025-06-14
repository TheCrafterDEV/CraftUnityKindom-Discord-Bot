const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const ms = require('ms');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member for a specific duration.')
    .addUserOption(option =>
      option.setName('target').setDescription('The member to timeout').setRequired(true))
    .addStringOption(option =>
      option.setName('duration').setDescription('e.g., 1s, 5m, 2h, 1d, 1w').setRequired(true))
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for timeout').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const allowedRoleId = 'Rollen ID';
    const logChannelId = 'Channel ID';

    if (!interaction.member.roles.cache.has(allowedRoleId)) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        flags: 64
      });
    }

    const target = interaction.options.getUser('target');
    const durationInput = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const durationMs = ms(durationInput);

    if (!durationMs || durationMs < 1000 || durationMs > 2419200000) {
      return interaction.reply({
        content: '❌ Invalid duration. Must be between 1s and 28d.',
        flags: 64
      });
    }

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);

    if (!member) {
      return interaction.reply({
        content: '❌ Could not find that member.',
        flags: 64
      });
    }

    try {
      await member.timeout(durationMs, reason);

      await interaction.reply({
        content: `✅ <@${target.id}> has been timed out.`,
        flags: 64
      });

      if (logChannel && logChannel.type === ChannelType.GuildText) {
        const embed = new EmbedBuilder()
          .setTitle('🛑 Timeout Issued')
          .setColor('Red')
          .addFields(
            { name: '👤 User', value: `<@${target.id}> (${target.id})`, inline: true },
            { name: '🕒 Duration', value: durationInput, inline: true },
            { name: '📝 Reason', value: reason },
            { name: '👮 Moderator', value: `<@${interaction.user.id}>`, inline: true }
          )
          .setTimestamp();
        logChannel.send({ embeds: [embed] });
      }

    } catch (err) {
      console.error(err);

      await interaction.reply({
        content: '❌ Failed to timeout the user.',
        flags: 64
      });

      if (logChannel && logChannel.type === ChannelType.GuildText) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('⚠️ Timeout Failed')
          .setColor('Orange')
          .addFields(
            { name: '👤 Target', value: `<@${target.id}> (${target.id})`, inline: true },
            { name: '📝 Reason Attempted', value: reason },
            { name: '👮 Attempted by', value: `<@${interaction.user.id}>`, inline: true },
            { name: '❌ Error', value: `\`\`\`${err.message}\`\`\`` }
          )
          .setTimestamp();
        logChannel.send({ embeds: [errorEmbed] });
      }
    }
  }
};
