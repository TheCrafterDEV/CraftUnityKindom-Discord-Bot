const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "welcome",
  async execute(member) {
    const channelId = "1382860199697580163";
    const channel = member.guild.channels.cache.get(channelId);

    if (!channel) {
      console.error("❌ Welcome channel not found.");
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Willkommen auf CraftUnityKindom!")
      .setDescription(`Willkommen <@${member.id}>! Dieses Server ist ein reiner Minecraft Discord Server.\n\nBitte lese dir zuerst die Regeln durch und bestätige sie dann damit du weißt welche Regeln bei uns gelten.\nWenn du dies getan hast kannst du voll durchstarten!`)
      .setColor("Blue")
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: "CraftUnityKindom Team", iconURL: member.client.user.displayAvatarURL() })
      .setTimestamp();

    channel.send({ embeds: [embed] });
  }
};
