import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';
import { readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commands = [];

async function loadCommands() {
    const commandFiles = await readdir(path.join(__dirname, 'commands'));

    for (const file of commandFiles) {
        if (!file.endsWith('.js')) continue;

        const filePath = path.join(__dirname, 'commands', file);
        const command = await import(`file://${filePath}`);

        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
        } else {
            console.warn(`⚠️ Command ${file} is invalid (no "data" or "execute").`);
        }
    }
}

async function registerSlashCommands() {
    const rest = new REST({ version: '10' }).setToken(config.token);
    try {
        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands },
        );
        console.log('✅ Slash commands registered.');
    } catch (error) {
        console.error('❌ Error registering:', error);
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: '❌ An error occurred while running.', ephemeral: true });
    }
});

client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

(async () => {
    await loadCommands();
    await registerSlashCommands();
    client.login(config.token);
})();
