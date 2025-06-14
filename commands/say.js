const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot say something.')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The message to say')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  async execute(interaction) {
    const allowedRoleIds = ['Rollen ID'];

    // Prüfen, ob der User eine der erlaubten Rollen hat
    const hasAllowedRole = interaction.member.roles.cache.some(role => allowedRoleIds.includes(role.id));

    if (!hasAllowedRole) {
      return interaction.reply({ content: '❌ You do not have permission to use this command.', flags: 64 });
    }

    const message = interaction.options.getString('message');

    await interaction.reply({ content: '🗣️ Message sent!', flags: 64 });
    await interaction.channel.send(message);
  }
};
