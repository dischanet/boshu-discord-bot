const Discord = require("discord.js");
const client = new Discord.Client();

const _recruit_status = [];
const _recruit_member = [];

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity("discha.net");
});

client.on("guildCreate", guild => {
  if (!guild.systemChannel) return;
  rec_man(guild.systemChannel);
});

client.on("message", message => {
  if (!message.content.startsWith("!")) return;
  if (!["募", "参", "e", "s", "r", "u"].includes(message.content[1])) return;
  if (message.content === "!募集くん") return rec_man(message.channel);
  if (message.content === "!募集キャンセル") return rec_cancel(message);
  if (message.content === "!募集締め切り" || message.content === "!end")
    return rec_end(message);
  if (
    message.content.startsWith("!募集") ||
    message.content.startsWith("!start")
  )
    return rec_start(message);
  if (message.content === "!参加" || message.content === "!r")
    return rec_join(message);
  if (message.content === "!参加キャンセル" || message.content === "!ur")
    return rec_join_cancel(message);
});

function rec_man(channel) {
  return channel.send(`使えるコマンド:

募集するとき:
!募集 [人数]
!募集 [人数] [タイトル]
!募集 [人数] [チーム数]
!募集 [人数] [チーム数] [タイトル]
(!startでも可)

キャンセルするとき:
!募集キャンセル

途中で締め切るとき:
!募集締め切り

参加するとき:
!参加
(!rでも可)

参加をキャンセルするとき:
!参加キャンセル
(!urでも可)

ヘルプを見るとき:
!募集くん`);
}

async function rec_start(message) {
  const recruit_message = message.content.split(" ");
  const is_recruit_exists = _recruit_status.some(
    status => status.channel_id === message.channel.id
  );
  if (is_recruit_exists)
    return message.channel.send(
      "現在行われている募集があります。\nキャンセルは:\n!募集キャンセル"
    );
  if (
    recruit_message.length < 2 ||
    (recruit_message[0] !== "!募集" && recruit_message[0] !== "!start") ||
    !Number.isInteger(Number(recruit_message[1])) ||
    recruit_message[1].length <= 0
  )
    return message.channel.send(
      "正しく入力してください。\n募集するには\n!募集 [人数] [チーム数(オプション)] [タイトル(オプション)]"
    );
  const team_num =
    recruit_message.length >= 3 && Number.isInteger(Number(recruit_message[2]))
      ? Number(recruit_message[2])
      : 0;
  let title = "";
  if (recruit_message.length >= 4) title = recruit_message[3];
  if (
    recruit_message.length >= 3 &&
    !Number.isInteger(Number(recruit_message[2]))
  )
    title = recruit_message[2];
  _recruit_status.push({
    channel_id: message.channel.id,
    rec_num: recruit_message[1],
    team_num,
    admin_name: message.author.tag,
    admin_id: message.author.id,
    title
  });
  let head = title ? `"${title}"` : "";
  await message.channel.send(
    `${head}参加者募集開始！あと${recruit_message[1]}人！`
  );
  head = title ? `[${title}]の` : "";
  return message.author.send(`${head}募集を開始しました。`);
}

async function rec_join(message) {
  const recruit_status = _recruit_status.find(
    status => status.channel_id === message.channel.id
  );
  if (!recruit_status)
    return message.channel.send(
      "現在行われている募集はありません。\n募集するには\n!募集 [人数] [チーム数(オプション)] [タイトル(オプション)]"
    );
  const recruit_members = _recruit_member.filter(
    member => member.channel_id === message.channel.id
  );
  const rest = recruit_status.rec_num - recruit_members.length - 1;
  _recruit_member.push({
    channel_id: message.channel.id,
    member_id: message.author.id
  });
  if (rest > 0) {
    const head = recruit_status.title ? `"${recruit_status.title}"` : "";
    return message.channel.send(`${head}参加者募集中！あと${rest}人！`);
  }
  return rec_finish(message, recruit_status);
}

async function rec_join_cancel(message) {
  const join = _recruit_member.some(
    member =>
      member.channel_id === message.channel.id &&
      member.member_id === message.author.id
  );
  if (!join) return message.channel.send("参加登録はありません");
  _recruit_member.splice(
    _recruit_member.findIndex(
      member =>
        member.channel_id === message.channel.id &&
        member.member_id === message.author.id
    ),
    1
  );
  return message.channel.send("この参加をキャンセルしました");
}

async function rec_end(message) {
  const recruit_status = _recruit_status.find(
    status => status.channel_id === message.channel.id
  );
  if (!recruit_status)
    return message.channel.send(
      "現在行われている募集はありません。\n募集するには\n!募集 [人数] [チーム数(オプション)] [タイトル(オプション)]"
    );
  return rec_finish(message, recruit_status);
}

async function rec_cancel(message) {
  const recruit_status = _recruit_status.find(
    status => status.channel_id === message.channel.id
  );
  if (!recruit_status)
    return message.channel.send(
      "現在行われている募集はありません。\n募集するには\n!募集 [人数] [チーム数(オプション)] [タイトル(オプション)]"
    );
  _recruit_status.splice(
    _recruit_status.findIndex(
      status => status.channel_id === message.channel.id
    ),
    1
  );
  _recruit_member.splice(
    _recruit_member.findIndex(
      member => member.channel_id === message.channel.id
    ),
    1
  );
  await message.channel.send("このチャンネルの募集をキャンセルしました");
  const head = recruit_status.title ? `[${recruit_status.title}]の` : "";
  return client.users
    .get(recruit_status.admin_id)
    .send(`${head}募集を、${message.author}がキャンセルしました。`);
}

async function rec_finish(message, recruit_status) {
  const recruit_members = _recruit_member.filter(
    member => member.channel_id === message.channel.id
  );
  _recruit_status.splice(
    _recruit_status.findIndex(
      status => status.channel_id === message.channel.id
    ),
    1
  );
  _recruit_member.splice(
    _recruit_member.findIndex(
      member => member.channel_id === message.channel.id
    ),
    1
  );
  const team_num = recruit_status.team_num;
  let announce = `${`<@${recruit_status.admin_id}>`}の募集終了！\n`;
  if (team_num === 0) {
    announce += recruit_status.title
      ? `"${recruit_status.title}"の参加者一覧:\n- `
      : "参加者一覧:";
    announce += recruit_members
      .map(member => `<@${member.member_id}>`)
      .join("\n- ");
  } else {
    const member_ids = recruit_members.map(member => member.member_id);
    shuffle(member_ids);
    const all_member_count = member_ids.length;
    const syou = Math.floor(all_member_count / team_num);
    const amari = all_member_count % team_num;
    announce += recruit_status.title
      ? `"${recruit_status.title}"の参加者・チーム一覧:`
      : "参加者・チーム一覧:";
    const team_wake = new Array(team_num).fill(syou);
    for (const i of range(amari)) team_wake[i] += 1;
    team_wake.forEach((group_nai, i) => {
      announce += `\nチーム[${i + 1}]`;
      range(group_nai).forEach(() => {
        announce += `\n- ${`<@${member_ids.pop()}>`}`;
      });
    });
  }
  await message.channel.send(announce);
  const head = recruit_status.title ? `[${recruit_status.title}]の` : "";
  return client.users
    .get(recruit_status.admin_id)
    .send(`${head}募集が終了しました。\n\n${announce}`);
}

function shuffle(array) {
  for (let i = array.length - 1; i >= 0; i--) {
    const rand = Math.floor(Math.random() * (i + 1));
    [array[i], array[rand]] = [array[rand], array[i]];
  }
}

function range(n) {
  return [...Array(n).keys()];
}

client.login(process.env.DISCORD_BOT_TOKEN);
