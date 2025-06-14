const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Remove timeout from a member.')
    .addUserOption(option =>
      option.setName('target').setDescription('The member to untimeout').setRequired(true))
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for untimeout').setRequired(false))
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
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);

    if (!member) {
      return interaction.reply({
        content: '❌ Could not find that member.',
        flags: 64
      });
    }

    try {
      await member.timeout(null, reason);

      await interaction.reply({
        content: `✅ <@${target.id}> has been removed from timeout.`,
        flags: 64
      });

      if (logChannel && logChannel.type === ChannelType.GuildText) {
        const embed = new EmbedBuilder()
          .setTitle('🔓 Timeout Removed')
          .setColor('Green')
          .addFields(
            { name: '👤 User', value: `<@${target.id}> (${target.id})`, inline: true },
            { name: '📝 Reason', value: reason },
            { name: '👮 Moderator', value: `<@${interaction.user.id}>`, inline: true }
          )
          .setTimestamp();
        logChannel.send({ embeds: [embed] });
      }

    } catch (err) {
      console.error(err);

      await interaction.reply({
        content: '❌ Failed to remove timeout.',
        flags: 64
      });

      if (logChannel && logChannel.type === ChannelType.GuildText) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('⚠️ Untimeout Failed')
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
