// events/autorole.js
const { Events } = require('discord.js');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const roleIds = [
      'Deine Rollen ID',
      'Deine Rollen ID', 
      'Deine Rollen ID'
    ];

    const rolesToAdd = roleIds
      .map(id => member.guild.roles.cache.get(id))
      .filter(role => {
        if (!role) console.warn(`⚠️ Rolle mit ID nicht gefunden.`);
        return role;
      });

    if (rolesToAdd.length === 0) {
      console.warn('⚠️ Keine gültigen Rollen zum Zuweisen gefunden.');
      return;
    }

    try {
      await member.roles.add(rolesToAdd);
      console.log(`✅ ${member.user.tag} wurden automatisch ${rolesToAdd.length} Rollen zugewiesen: ${rolesToAdd.map(r => r.name).join(', ')}`);
    } catch (error) {
      console.error(`❌ Fehler beim Zuweisen der Rollen an ${member.user.tag}:`, error);
    }
  },
};
