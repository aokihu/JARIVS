'use strict'
/**
 * 核心程序
 */

const Config = require('./configure.js')
const mosca = require('mosca')
const pm2 = require('pm2')
const dgram = require('dgram')
const os = require('os')

//
// MQTT 服务器
// 核心消息服务器
//

var MoscaSettings = {
  port:Config.mosca.port
}

var MoscaServer = new mosca.Server(MoscaSettings)

MoscaServer.on('ready', () => {
  console.log('Mosca Server is working...')
})

MoscaServer.on('clientConnected', (client) => {
  console.log('Node Connect:', client.id)
})

//
// Discover 发现服务
// 通过UDP实现的发现服务
//
var DiscoverServer = dgram.createSocket("udp4");
DiscoverServer.bind(Config.discover.ping, () => {
	DiscoverServer.setBroadcast(true);
	DiscoverServer.setMulticastTTL(128);

	// 获得本机IP地址
	let ifaces = os.networkInterfaces();

	for(let at in ifaces){
	  // 搜索非内网的网络端口
	  let iface = ifaces[at];
	  iface.forEach(mesh => {
	    if(mesh.internal === true)
	      return false;

	    if(mesh.family === 'IPv4'){
				DiscoverServer.addMembership(Config.discover.group, mesh.address);
				console.log(`join ${Config.discover.group}@${mesh.address}`)
	      return false;
	    }
	  })
	}
});

DiscoverServer.on('listening', function(){
	console.log("Discover Server listening...");
	console.log("Server Infomation:",
		"\n\tPort:"+DiscoverServer.address().port);
});

DiscoverServer.on('message', function(msg, client){

	var strMsg = msg.toString();
	console.log("Client Info:", client);

	if(strMsg === 'hello')
	{
		var retMsg = new Buffer('world');
		DiscoverServer.send(retMsg,0,retMsg.length, Config.discover.pong, Config.discover.group);
	}
});
