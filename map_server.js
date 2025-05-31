const { Client, Events, GatewayIntentBits, Partials } = require('discord.js');
const { token, bdd_url } = require('./config.json');
const { MongoClient } = require('mongodb');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildVoiceStates], partials: [Partials.Message, Partials.Channel, Partials.Reaction] });
const bdd_client = new MongoClient(bdd_url);

bdd_client.connect();

const db = bdd_client.db("discord_crm");
const user_events = db.collection("user_events");

function getNextMessages(channel, message_id) {
    channel.messages.fetch({ limit: 100, before: message_id }).then(messages => {
        console.log(`Received ${messages.size} messages`);
        messages.forEach(message => {
            console.log(message.content)
            user_events.insertOne({
                timestamp: message.createdTimestamp,
                user_id: message.author.id,
                server_id: message.guildId,
                channel_id: message.channelId,
                event_type: "message"
            })
        });
        if (messages.size == 0) return
        getNextMessages(channel, messages.last().id)
    });
}

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    console.log(client.guilds)
    const channels = client.guilds.cache.get('1145408283872596008').channels.cache.filter(chan => chan.type == 0)

    channels.forEach(channel => {
        console.log(channel.name)
        getNextMessages(channel, "1378088404163625062")
    })
});



client.login(token);