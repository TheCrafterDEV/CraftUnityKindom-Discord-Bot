const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Partials, Collection, REST, Routes } = require("discord.js");

const configPath = "./config.json";
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify({
    token: "YOUR_BOT_TOKEN_HERE",
    clientId: "YOUR_CLIENT_ID",
    guildId: "YOUR_GUILD_ID"
  }, null, 2));
  console.log("✅ config.json erstellt. Bitte fülle token, clientId und guildId aus.");
  process.exit();
}
const { token, clientId, guildId } = require(configPath);

// Bot Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences, // Wichtig für stafflist-Status
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.GuildMember, Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();

// Slash-Commands laden
const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }
}

// Events laden
const eventsPath = path.join(__dirname, "events");
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
}

// Slash-Commands automatisch registrieren
const rest = new REST({ version: "10" }).setToken(token);
(async () => {
  try {
    console.log("🔁 Registriere Slash-Commands...");
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log("✅ Slash-Commands erfolgreich registriert!");
  } catch (error) {
    console.error("❌ Fehler bei der Slash-Command-Registrierung:", error);
  }
})();

// Slash-Command-Handler
client.on("interactionCreate", async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error("❌ Fehler beim Ausführen des Befehls:", error);
      await interaction.reply({ content: "❌ Fehler beim Ausführen dieses Befehls.", flags: 1 << 6 });
    }
  } else if (interaction.isStringSelectMenu()) {
    const command = client.commands.get("panel-setup");
    if (command?.handleSelect) {
      try {
        await command.handleSelect(interaction);
      } catch (error) {
        console.error("❌ Fehler bei handleSelect:", error);
      }
    }
  } else if (interaction.isButton()) {
    const command = client.commands.get("panel-setup");
    if (command?.handleButton) {
      try {
        if (interaction.channel?.isThread()) {
          if (interaction.channel.archived) {
            try {
              await interaction.deferReply({ ephemeral: true });
              await interaction.channel.setArchived(false, 'Thread muss für Interaktion aktiv sein');
              await interaction.editReply("🔄 Thread wurde reaktiviert. Bitte erneut auf den Button klicken.");
              return;
            } catch (err) {
              console.error("❌ Konnte Thread nicht reaktivieren:", err);
              return interaction.reply({
                content: "❌ Fehler: Dieser Thread ist archiviert und konnte nicht reaktiviert werden.",
                ephemeral: true
              });
            }
          }
        }
        await command.handleButton(interaction);
      } catch (error) {
        console.error("❌ Fehler bei handleButton:", error);
        if (!interaction.replied) {
          await interaction.reply({
            content: "❌ Es gab einen Fehler beim Verarbeiten der Button-Aktion.",
            ephemeral: true
          });
        }
      }
    }
  }
});

// Welcome-Event (optional)
try {
  const welcomeCommand = require("./commands/welcome.js");
  client.on("guildMemberAdd", member => welcomeCommand.execute(member));
} catch (e) {
  console.log("ℹ️ Kein welcome.js vorhanden oder Fehler beim Laden.");
}

// Bot bereit
client.once("ready", () => {
  console.log(`🤖 Bot eingeloggt als ${client.user.tag}`);
});

client.login(token);
require("./discord-status")(client);
