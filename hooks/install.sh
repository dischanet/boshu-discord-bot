#!/bin/bash

cd /home/ec2-user/repos/boshu-discord-bot

/usr/bin/npm install --production

if [ "$DEPLOYMENT_GROUP_NAME" == "develop" ]
then
    PARAMETER_NAME=BOSHU_DEVELOP_DISCORD_BOT_SECRET
else
    PARAMETER_NAME=BOSHU_DISCORD_BOT_SECRET
fi
REGION=$(curl -s 169.254.169.254/latest/meta-data/local-hostname | cut -d '.' -f2)
echo "DISCORD_BOT_TOKEN=$(aws --region ${REGION} ssm get-parameter --name ${PARAMETER_NAME} --query "Parameter.Value" --output text)" > environment

cp ./hooks/boshu-discord-bot.service /etc/systemd/system/boshu-discord-bot.service
/usr/bin/systemctl enable boshu-discord-bot
