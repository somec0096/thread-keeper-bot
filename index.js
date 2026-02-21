const { Client, GatewayIntentBits, ChannelType } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
});

client.once("ready", async () => {
  console.log(`✅ 机器人 ${client.user.tag} 已启动，开始自动处理所有论坛...`);

  // 服务器ID
  const GUILD_ID = "1361734105699713137";

  try {
    const guild = await client.guilds.fetch(GUILD_ID);

    // 获取所有频道，确保缓存完整
    await guild.channels.fetch();

    // 筛选出所有论坛频道
    const forumChannels = guild.channels.cache.filter(
      (channel) => channel.type === ChannelType.GuildForum,
    );

    console.log(`📢 在服务器中找到了 ${forumChannels.size} 个论坛频道。`);

    for (const forumChannel of forumChannels.values()) {
      console.log(
        `\n--- 开始处理论坛频道: ${forumChannel.name} (ID: ${forumChannel.id}) ---`,
      );

      // 获取该论坛下的所有活跃帖子
      const activeThreads = await forumChannel.threads.fetchActive();
      console.log(`找到 ${activeThreads.threads.size} 个活跃帖子`);

      for (const thread of activeThreads.threads.values()) {
        try {
          // 发送空白消息并立即删除
          const sentMessage = await thread.send("\u200b");
          await sentMessage.delete();
          console.log(`  ✅ 续命成功: ${thread.name}`);
        } catch (threadError) {
          console.error(`  ❌ 续命失败 ${thread.name}: ${threadError.message}`);
        }
      }
    }

    console.log("\n✨ 所有论坛频道处理完毕！");
  } catch (error) {
    console.error("❌ 严重错误:", error);
  } finally {
    client.destroy();
    console.log("机器人已安全断开连接。");
  }
});

// 从环境变量读取 Token
client.login(process.env.DISCORD_TOKEN);
