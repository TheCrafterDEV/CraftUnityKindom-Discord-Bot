// discord-status.js
module.exports = (client) => {
  let openTickets = 0;

  const statuses = [
    () => ({ type: 0, name: 'CraftUnityKindom' }),                         
    () => ({ type: 2, name: '/invite' }),                                
    () => ({ type: 0, name: `with ${openTickets} Tickets` }),           
    () => ({ type: 1, name: 'Made by TheCrafterDEV' })
  ];

  let i = 0;

  const updateTicketCount = async () => {
    try {
      const guild = client.guilds.cache.get(require("./config.json").guildId);
      const threads = await guild.channels.fetchActiveThreads();
      openTickets = threads.threads.filter(thread => thread.name?.toLowerCase().includes("ticket")).size;
    } catch (err) {
      console.error("❌ Fehler beim Abrufen der offenen Tickets:", err);
      openTickets = 0;
    }
  };

  client.once("ready", async () => {
    console.log("🎮 Starte dynamischen Bot-Status");
    
    await updateTicketCount();

    // Alle 5s Ticketanzahl aktualisieren
    setInterval(updateTicketCount, 5000);

    // Alle 15s den Bot-Status wechseln
    setInterval(() => {
      const status = statuses[i % statuses.length]();
      client.user.setActivity(status.name, {
        type: status.type,
        url: status.type === 1 ? "https://CraftUnityKindom.de/" : undefined
      });
      i++;
    }, 15000);
  });
};
