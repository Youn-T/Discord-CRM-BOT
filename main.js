const { Client, Events, GatewayIntentBits, Partials } = require('discord.js');
const { token,bdd_url } = require('./config.json');
const { MongoClient } = require('mongodb');

const client = new Client({ intents: [GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildVoiceStates] ,partials: [Partials.Message, Partials.Channel, Partials.Reaction]});
const bdd_client = new MongoClient(bdd_url);


client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    console.log(client.guilds)
});

bdd_client.connect();

const db = bdd_client.db("discord_crm");
const user_events = db.collection("user_events");



client.on(Events.MessageCreate, message => {
    user_events.insertOne({
    timestamp: message.createdTimestamp,
    user_id: message.author.id,
    server_id: message.guildId,
    channel_id: message.channelId,
    event_type: "message"
  })

  logging()
});

client.on(Events.MessageReactionAdd, (reaction, user) => {
    user_events.insertOne({
    timestamp: new Date().getTime(),
    user_id: user.id,
    server_id: reaction.message.guildId,
    channel_id: reaction.message.channelId,
    event_type: "reaction"
  })

  logging()
});

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    if (oldState?.channel?.name === undefined) { // connected
        // currentVoiceSessions[newState.member.user.username] = { channel: newState.channelId, start: new Date().getTime() };
            user_events.insertOne({
            timestamp: new Date().getTime(),
            user_id: newState.member.id,
            server_id: newState.guild.id,
            channel_id: newState.channelId,
            event_type: "voice_join"
        })

    } else if (newState?.channel?.name === undefined) { // disconnected

        // voiceChannels[oldState?.guild.id][oldState?.channel?.id].push({ name: newState.member.user.username, start: currentVoiceSessions[newState.member.user.username].start, end: new Date().getTime() });
            user_events.insertOne({
            timestamp: new Date().getTime(),
            user_id: oldState.member.id,
            server_id: oldState.guild.id,
            channel_id: oldState.channelId,
            event_type: "voice_leave"
        })
    }
    logging()
});

async function logging() {
    const messages = await user_events.find({ event_type: "message" }).toArray();
    console.log("Messages: ", messages);
    const reactions = await user_events.find({ event_type: "reaction" }).toArray();
    console.log("Réactions: ", reactions);
    const joins = await user_events.find({ event_type: "voice_join" }).toArray();
    console.log("Joins: ", joins);
    const leave = await user_events.find({ event_type: "voice_leave" }).toArray();
    console.log("Leave: ", leave);
}

client.login(token);

// TODO taux de maturité 
// TODO taux de réponse