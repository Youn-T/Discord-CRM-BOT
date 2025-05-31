const { Client, Events, GatewayIntentBits, Partials } = require('discord.js');
const { MongoClient } = require('mongodb');

const client = new Client({ intents: [GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildVoiceStates] ,partials: [Partials.Message, Partials.Channel, Partials.Reaction]});
const bdd_client = new MongoClient(process.env.BDD_URL);

bdd_client.connect();
const db = bdd_client.db("discord_crm");
const user_events = db.collection("user_events");

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    console.log(client.guilds)
});


client.on(Events.MessageCreate, message => {
    user_events.insertOne({
    timestamp: message.createdTimestamp,
    user_id: message.author.id,
    server_id: message.guildId,
    channel_id: message.channelId,
    event_type: "message"
  })
});

client.on(Events.MessageReactionAdd, (reaction, user) => {
    user_events.insertOne({
    timestamp: new Date().getTime(),
    user_id: user.id,
    server_id: reaction.message.guildId,
    channel_id: reaction.message.channelId,
    event_type: "reaction"
  })
});

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    if (oldState?.channel?.name === undefined) { // connected
            user_events.insertOne({
            timestamp: new Date().getTime(),
            user_id: newState.member.id,
            server_id: newState.guild.id,
            channel_id: newState.channelId,
            event_type: "voice_join"
        })

    } else if (newState?.channel?.name === undefined) { // disconnected

            user_events.insertOne({
            timestamp: new Date().getTime(),
            user_id: oldState.member.id,
            server_id: oldState.guild.id,
            channel_id: oldState.channelId,
            event_type: "voice_leave"
        })
    }
});

client.login(process.env.BOT_TOKEN);