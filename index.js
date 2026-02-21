const { Client, GatewayIntentBits, ChannelType } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
});

// ---------- 定义带重试的发送函数 ----------
async function sendWithRetry(thread, retries = 3, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const sentMessage = await thread.send("\u200b");
      await sentMessage.delete();
      console.log(`  ✅ 续命成功: ${thread.name}`);
      return true;
    } catch (error) {
      if (attempt === retries) {
        console.error(
          `  ❌ 续命失败 ${thread.name} (重试${retries}次后): ${error.message}`,
        );
        return false;
      }
      console.log(
        `  ⚠️ 第${attempt}次失败，${delay / 1000}秒后重试: ${thread.name} (${error.message})`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
// -----------------------------------------

client.once("ready", async () => {
  console.log(
    `✅ 机器人 ${client.user.tag} 已启动，开始自动处理所有论坛的活跃帖子...`,
  );

  const GUILD_ID = "1361734105699713137"; // 确认是你的服务器ID

  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    await guild.channels.fetch();

    // 获取所有论坛频道
    const forumChannels = guild.channels.cache.filter(
      (channel) => channel.type === ChannelType.GuildForum,
    );
    console.log(`📢 在服务器中找到了 ${forumChannels.size} 个论坛频道。`);

    for (const forumChannel of forumChannels.values()) {
      console.log(
        `\n--- 开始处理论坛频道: ${forumChannel.name} (ID: ${forumChannel.id}) ---`,
      );

      // 仅获取活跃帖子
      const activeThreads = await forumChannel.threads.fetchActive();
      console.log(`找到 ${activeThreads.threads.size} 个活跃帖子`);

      // 处理每个活跃帖子（带重试）
      for (const thread of activeThreads.threads.values()) {
        await sendWithRetry(thread, 3, 2000);
      }
    }

    console.log("\n✨ 所有活跃帖子处理完毕！");
  } catch (error) {
    console.error("❌ 严重错误:", error);
  } finally {
    client.destroy();
    console.log("机器人已安全断开连接。");
  }
});

// 从环境变量读取 Token
client.login(process.env.DISCORD_TOKEN);
