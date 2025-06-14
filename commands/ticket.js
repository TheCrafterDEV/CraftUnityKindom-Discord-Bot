const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const SUPPORT_CHANNEL_ID = 'Channel ID'; // Dort wirt das Support Panel gepostet und die Threads erstellt
const LOG_CHANNEL_ID = 'Channel ID';
const TRANSCRIPT_CHANNEL_ID = 'Channel ID';
const ALLOWED_ROLE_ID = 'Rollen ID';

const activeTickets = new Map();

// Kategorie → Supporter-Rollen-Zuordnung
const CATEGORY_SUPPORT_ROLES = {
  'Support': 'Support Rollen ID',
  'Bugs': 'Support Rollen ID',
  'Bewerbung': 'Support Rollen ID',
  'Partner Support': 'Support Rollen ID'
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel-setup')
    .setDescription('Send a ticket panel to the support channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({ content: '❌ You are not allowed to use this command.', ephemeral: true });
    }

    const channel = interaction.guild.channels.cache.get(SUPPORT_CHANNEL_ID);
    if (!channel) return interaction.reply({ content: '❌ Support channel not found.', ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle('🎟️ Öffne ein Support Ticket')
      .setDescription('Wähle eine Support-Kategorie aus um ein Ticket zu erstellen.')
      .setColor('Blue');

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_select')
      .setPlaceholder('Wähle eine Kategorie')
      .addOptions(
        { label: 'Support', description: 'Allgemeiner Support', emoji: '💬', value: 'Support' },
        { label: 'Bugs', description: 'Melde eine Bug', emoji: '🐞', value: 'Bugs' },
        { label: 'Bewerbung', description: 'Bewerbe dich', emoji: '📄', value: 'Bewerbung' },
        { label: 'Partner Support', description: 'Partner anfragen', emoji: '🤝', value: 'Partner Support' }
      );

    const row = new ActionRowBuilder().addComponents(menu);
    await channel.send({ embeds: [embed], components: [row] });

    await interaction.reply({ content: '✅ Ticket panel sent.', ephemeral: true });
  },

  async handleSelect(interaction) {
    const selected = interaction.values[0];
    const channel = interaction.guild.channels.cache.get(SUPPORT_CHANNEL_ID);

    const thread = await channel.threads.create({
      name: `Ticket - ${interaction.user.username} - ${selected}`,
      autoArchiveDuration: 1440,
      type: ChannelType.PrivateThread,
      reason: 'New ticket',
      invitable: false
    });

    await thread.members.add(interaction.user.id);

    const supportRoleId = CATEGORY_SUPPORT_ROLES[selected];
    if (supportRoleId) {
      const role = await interaction.guild.roles.fetch(supportRoleId);
      if (role) {
        for (const [memberId] of role.members) {
          await thread.members.add(memberId).catch(console.error);
        }
      }
    }

    activeTickets.set(thread.id, interaction.user.id);

    const embed = new EmbedBuilder()
      .setTitle('🎟️ Ticket erstellt')
      .setDescription(`User ${interaction.user} opened a ticket in **${selected}**.\n[Jump to Ticket](${thread.url})`)
      .setColor('Green')
      .setTimestamp();

    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) logChannel.send({ embeds: [embed] });

    const start = await thread.send(`🎟️ Ticket created by ${interaction.user} in **${selected}**.`);
    await start.react('👀');

    const close = new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 Ticket Schließen').setStyle(ButtonStyle.Primary);
    const del = new ButtonBuilder().setCustomId('delete_ticket').setLabel('🗑️ Ticket Löschen').setStyle(ButtonStyle.Danger);
    const row = new ActionRowBuilder().addComponents(close, del);

    await thread.send({
      content: 'Bitte beschreibe dein Anliegen so genau wie möglich..',
      components: [row]
    });

    await interaction.reply({ content: `✅ Ticket created: ${thread}`, ephemeral: true });
  },

  async handleButton(interaction) {
    const thread = interaction.channel;
    const creator = activeTickets.get(thread.id);
    const memberRoles = interaction.member.roles.cache;

    if (!creator) return;

    const selectedCategory = thread.name.split(' - ').pop();
    const supportRoleId = CATEGORY_SUPPORT_ROLES[selectedCategory];
    const isSupport = supportRoleId && memberRoles.has(supportRoleId);

    if (interaction.customId === 'close_ticket') {
      if (interaction.user.id !== creator && !isSupport) {
        return interaction.reply({ content: '❌ Du kannst das Ticket nicht schließen.', ephemeral: true });
      }

      await thread.setArchived(true, 'Geschlossen von user');
      const embed = new EmbedBuilder()
        .setTitle('🔒 Ticket geschlossen')
        .setDescription(`Ticket ${thread.name} closed by ${interaction.user}`)
        .setColor('Yellow')
        .setTimestamp();

      const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
      if (logChannel) logChannel.send({ embeds: [embed] });

      await interaction.reply({ content: '🔒 Ticket Geschlossen.', ephemeral: true });
    }

    if (interaction.customId === 'delete_ticket') {
      if (!isSupport) {
        return interaction.reply({ content: '❌ Nur der Support kann das Ticket schließen.', ephemeral: true });
      }

      const messages = await thread.messages.fetch({ limit: 100 });
      const transcript = messages.map(m => `${m.author.tag}: ${m.content}`).reverse().join('\n');

      const filename = path.join(__dirname, `../transcripts/${thread.name.replace(/[^\w]/g, '_')}.txt`);
      fs.mkdirSync(path.dirname(filename), { recursive: true });
      fs.writeFileSync(filename, transcript);

      const transcriptChannel = interaction.guild.channels.cache.get(TRANSCRIPT_CHANNEL_ID);
      if (transcriptChannel) {
        await transcriptChannel.send({
          content: `📝 Transcript für das Ticket ${thread.name}`,
          files: [filename]
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('🗑️ Ticket Geschlossen')
        .setDescription(`Ticket ${thread.name} deleted by ${interaction.user}`)
        .setColor('Red')
        .setTimestamp();

      const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
      if (logChannel) logChannel.send({ embeds: [embed] });

      await interaction.reply({ content: '🗑️ Ticket wird geschlossen.', ephemeral: true });
      setTimeout(() => thread.delete().catch(console.error), 3000);
    }
  }
};
