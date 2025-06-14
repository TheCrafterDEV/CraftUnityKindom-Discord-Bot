const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Generates a permanent invite link to this server.'),
  
  async execute(interaction) {
    const guild = interaction.guild;

    try {
      const channel = guild.channels.cache.find(
        ch => ch.type === 0 && ch.permissionsFor(guild.members.me).has("CreateInstantInvite")
      );

      if (!channel) {
        return interaction.reply({ content: "❌ I can't create an invite in any channel.", ephemeral: true });
      }

      const invite = await channel.createInvite({
        maxAge: 0,
        maxUses: 0,
        reason: `Invite created via /invite by ${interaction.user.tag}`
      });

      await interaction.reply({
        content: `✅ Here is your invite link: ${invite.url}`,
        flags: 64 // Nur sichtbar für den User, der den Befehl ausführt
      });
    } catch (err) {
      console.error("Invite creation failed:", err);
      await interaction.reply({
        content: "❌ Failed to create invite. Please check my permissions.",
        flags: 64
      });
    }
  }
};
